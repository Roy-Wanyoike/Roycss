// Package main is the entry point for the RoyCSS Go API.
//
// RoyCSS runs a DUAL-BACKEND architecture:
//   - backend-node/  — Express + Prisma (the running source of truth)
//   - backend-go/    — this package (production target: Cloud Run + PG + Redis)
//
// Both expose the same /api/v1 surface. Today the Go backend has real
// implementations for auth, effects, and health; the other 70 modules return
// 501 so clients fall back to backend-node per the failover design.
package main

import (
        "context"
        "errors"
        "fmt"
        "net/http"
        "os"
        "os/signal"
        "syscall"
        "time"

        "github.com/roycss/platform/internal/accessibility"
        "github.com/roycss/platform/internal/academy"
        "github.com/roycss/platform/internal/analytics"
        "github.com/roycss/platform/internal/architect"
        authmod "github.com/roycss/platform/internal/auth"
        "github.com/roycss/platform/internal/audit"
        "github.com/roycss/platform/internal/audit-center"
        "github.com/roycss/platform/internal/benchmark"
        "github.com/roycss/platform/internal/blocks"
        "github.com/roycss/platform/internal/blueprints"
        "github.com/roycss/platform/internal/bundle"
        "github.com/roycss/platform/internal/cdn"
        "github.com/roycss/platform/internal/certifications"
        "github.com/roycss/platform/internal/challenges"
        "github.com/roycss/platform/internal/cloud"
        "github.com/roycss/platform/internal/collections"
        "github.com/roycss/platform/internal/color-space"
        "github.com/roycss/platform/internal/compliance"
        "github.com/roycss/platform/internal/contact"
        "github.com/roycss/platform/internal/deploy"
        "github.com/roycss/platform/internal/designer"
        "github.com/roycss/platform/internal/devtools"
        "github.com/roycss/platform/internal/digital-twin"
        "github.com/roycss/platform/internal/edge"
        "github.com/roycss/platform/internal/effects"
        "github.com/roycss/platform/internal/enterprise"
        "github.com/roycss/platform/internal/fallback"
        "github.com/roycss/platform/internal/favorites"
        "github.com/roycss/platform/internal/fleet"
        "github.com/roycss/platform/internal/generator"
        "github.com/roycss/platform/internal/governance"
        "github.com/roycss/platform/internal/health"
        "github.com/roycss/platform/internal/icons"
        "github.com/roycss/platform/internal/initial-letter"
        "github.com/roycss/platform/internal/inspector"
        "github.com/roycss/platform/internal/light-dark"
        "github.com/roycss/platform/internal/live"
        "github.com/roycss/platform/internal/logical-properties"
        "github.com/roycss/platform/internal/marketplace"
        "github.com/roycss/platform/internal/mcp"
        "github.com/roycss/platform/internal/mentor"
        "github.com/roycss/platform/internal/metrics"
        "github.com/roycss/platform/internal/motion"
        "github.com/roycss/platform/internal/observatory"
        "github.com/roycss/platform/internal/open"
        "github.com/roycss/platform/internal/openapi"
        osmod "github.com/roycss/platform/internal/os"
        "github.com/roycss/platform/internal/pair"
        "github.com/roycss/platform/internal/patterns"
        "github.com/roycss/platform/internal/plugin-hub"
        "github.com/roycss/platform/internal/preview"
        "github.com/roycss/platform/internal/pro-components"
        "github.com/roycss/platform/internal/profiler"
        "github.com/roycss/platform/internal/property-registrar"
        "github.com/roycss/platform/internal/recipes"
        "github.com/roycss/platform/internal/refactor"
        "github.com/roycss/platform/internal/registry"
        "github.com/roycss/platform/internal/relative-color"
        "github.com/roycss/platform/internal/review"
        "github.com/roycss/platform/internal/scaffold"
        "github.com/roycss/platform/internal/scope"
        "github.com/roycss/platform/internal/search"
        "github.com/roycss/platform/internal/spotlight"
        "github.com/roycss/platform/internal/starting-style"
        "github.com/roycss/platform/internal/storage"
        "github.com/roycss/platform/internal/studio"
        "github.com/roycss/platform/internal/style-query"
        "github.com/roycss/platform/internal/subgrid"
        syncmod "github.com/roycss/platform/internal/sync"
        "github.com/roycss/platform/internal/text-wrap"
        "github.com/roycss/platform/internal/themes"
        "github.com/roycss/platform/internal/version"
        "github.com/roycss/platform/internal/workspace"

        "github.com/roycss/platform/pkg/cache"
        "github.com/roycss/platform/pkg/config"
        "github.com/roycss/platform/pkg/database"
        httpmw "github.com/roycss/platform/pkg/http"
        "github.com/roycss/platform/pkg/logger"
)

func main() {
        // ── Distroless healthcheck subcommand (issue #266) ───────────────
        // The runtime image (gcr.io/distroless/static-debian12:nonroot) has
        // NO shell and no wget/curl, so the docker-compose probe execs this
        // binary itself: ["CMD", "/app/api", "healthcheck"]. Handled before
        // any config/db init so the probe stays cheap and side-effect free.
        if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
                os.Exit(runHealthcheck())
        }

        log := logger.New("info")

        cfg, err := config.Load()
        if err != nil {
                log.Error("config load failed", "err", err)
                os.Exit(1)
        }
        log = logger.New(cfg.LogLevel)

        ctx, cancel := context.WithCancel(context.Background())
        defer cancel()

        // ── Database (PostgreSQL via pgx) ──────────────────────────────────
        pool, err := database.New(ctx, cfg.DatabaseURL)
        if err != nil {
                log.Error("database connection failed", "err", err)
                os.Exit(1)
        }
        defer pool.Close()
        log.Info("database connected", "maxConns", 25)

        // ── Redis cache (optional) ──────────────────────────────────────────
        c, err := cache.New(ctx, cfg.RedisURL, 5*time.Minute)
        if err != nil {
                log.Warn("redis connection failed — caching disabled", "err", err)
        } else if c != nil {
                log.Info("redis connected", "ttl", "5m")
        }

        // ── Seed effects from dist/effects.json ─────────────────────────────
        eff := effects.New(cfg.EffectsDataPath, c)
        if err := eff.Load(); err != nil {
                log.Warn("effects seed failed — effects endpoints will error", "err", err, "path", cfg.EffectsDataPath)
        } else {
                log.Info("effects seeded", "count", eff.Count())
        }

        mux := http.NewServeMux()

        // ── Real implementations ────────────────────────────────────────────
        health.New(pool, c).RegisterRoutes(mux)
        authSvc := authmod.New(pool, cfg)
        authSvc.RegisterRoutes(mux)
        eff.RegisterRoutes(mux)

        // ── 70 stub modules (return 501 → failover to backend-node) ─────────
        // favorites/collections/audit/metrics/openapi were added in issue #270 —
        // they existed in backend-node but not even as Go stubs, so failover
        // clients hit a mux 404 instead of the 501 failover signal. inspector
        // was referenced by main.go but its package was missing from the tree.
        registerStubs(mux,
                academy.RegisterRoutes,
                accessibility.RegisterRoutes,
                analytics.RegisterRoutes,
                architect.RegisterRoutes,
                audit.RegisterRoutes,
                auditcenter.RegisterRoutes,
                benchmark.RegisterRoutes,
                blocks.RegisterRoutes,
                blueprints.RegisterRoutes,
                bundle.RegisterRoutes,
                cdn.RegisterRoutes,
                certifications.RegisterRoutes,
                challenges.RegisterRoutes,
                cloud.RegisterRoutes,
                collections.RegisterRoutes,
                colorspace.RegisterRoutes,
                compliance.RegisterRoutes,
                contact.RegisterRoutes,
                deploy.RegisterRoutes,
                designer.RegisterRoutes,
                devtools.RegisterRoutes,
                digitaltwin.RegisterRoutes,
                edge.RegisterRoutes,
                enterprise.RegisterRoutes,
                fallback.RegisterRoutes,
                favorites.RegisterRoutes,
                fleet.RegisterRoutes,
                generator.RegisterRoutes,
                governance.RegisterRoutes,
                icons.RegisterRoutes,
                initialletter.RegisterRoutes,
                inspector.RegisterRoutes,
                lightdark.RegisterRoutes,
                live.RegisterRoutes,
                logicalproperties.RegisterRoutes,
                marketplace.RegisterRoutes,
                mcp.RegisterRoutes,
                mentor.RegisterRoutes,
                metrics.RegisterRoutes,
                motion.RegisterRoutes,
                observatory.RegisterRoutes,
                open.RegisterRoutes,
                openapi.RegisterRoutes,
                osmod.RegisterRoutes,
                pair.RegisterRoutes,
                patterns.RegisterRoutes,
                pluginhub.RegisterRoutes,
                preview.RegisterRoutes,
                procomponents.RegisterRoutes,
                profiler.RegisterRoutes,
                propertyregistrar.RegisterRoutes,
                recipes.RegisterRoutes,
                refactor.RegisterRoutes,
                registry.RegisterRoutes,
                relativecolor.RegisterRoutes,
                review.RegisterRoutes,
                scaffold.RegisterRoutes,
                scope.RegisterRoutes,
                search.RegisterRoutes,
                spotlight.RegisterRoutes,
                startingstyle.RegisterRoutes,
                storage.RegisterRoutes,
                studio.RegisterRoutes,
                stylequery.RegisterRoutes,
                subgrid.RegisterRoutes,
                syncmod.RegisterRoutes,
                textwrap.RegisterRoutes,
                themes.RegisterRoutes,
                version.RegisterRoutes,
                workspace.RegisterRoutes,
        )

        // ── Middleware chain ────────────────────────────────────────────────
        handler := httpmw.Recover(
                httpmw.RequestID(
                        httpmw.SecurityHeaders(
                                httpmw.CORS(cfg)(mux),
                        ),
                ),
        )

        server := &http.Server{
                Addr:         ":" + cfg.Port,
                Handler:      handler,
                ReadTimeout:  10 * time.Second,
                WriteTimeout: 30 * time.Second,
                IdleTimeout:  120 * time.Second,
        }

        go func() {
                log.Info("RoyCSS Go API starting", "port", cfg.Port, "env", cfg.NodeEnv)
                if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
                        log.Error("server failed", "err", err)
                        os.Exit(1)
                }
        }()

        quit := make(chan os.Signal, 1)
        signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
        <-quit
        log.Info("shutting down")

        shutCtx, shutCancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer shutCancel()
        _ = server.Shutdown(shutCtx)
        log.Info("stopped")
}

// registerStubs mounts each stub module's routes on the mux. The stubs
// return 501 so clients fall back to backend-node.
func registerStubs(mux *http.ServeMux, registrations ...func(*http.ServeMux)) {
        for _, reg := range registrations {
                reg(mux)
        }
}

// runHealthcheck backs the `api healthcheck` subcommand used by the
// docker-compose probe (issue #266): it GETs the liveness endpoint on
// localhost and exits 0 (healthy) or 1 (unhealthy). Liveness — not the
// full /api/v1/health — is the right probe here: a Redis blip must not
// flip the container unhealthy and trigger restarts.
func runHealthcheck() int {
        port := os.Getenv("PORT")
        if port == "" {
                port = "4000"
        }
        url := "http://127.0.0.1:" + port + "/api/v1/health/live"
        client := &http.Client{Timeout: 5 * time.Second}
        resp, err := client.Get(url)
        if err != nil {
                fmt.Fprintf(os.Stderr, "healthcheck: GET %s failed: %v\n", url, err)
                return 1
        }
        defer resp.Body.Close()
        if resp.StatusCode != http.StatusOK {
                fmt.Fprintf(os.Stderr, "healthcheck: GET %s returned %s\n", url, resp.Status)
                return 1
        }
        return 0
}
