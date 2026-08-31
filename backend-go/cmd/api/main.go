// Package main is the entry point for the RoyCSS Go API.
//
// RoyCSS runs a DUAL-BACKEND architecture:
//   - backend-node/  — Express + Prisma (the running source of truth)
//   - backend-go/    — this package (production target: Cloud Run + PG + Redis)
//
// Both expose the same /api/v1 surface. Today the Go backend has real
// implementations for auth, effects, and health; the other 66 modules return
// 501 so clients fall back to backend-node per the failover design.
package main

import (
        "context"
        "errors"
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
        "github.com/roycss/platform/internal/auditcenter"
        "github.com/roycss/platform/internal/benchmark"
        "github.com/roycss/platform/internal/blocks"
        "github.com/roycss/platform/internal/blueprints"
        "github.com/roycss/platform/internal/bundle"
        "github.com/roycss/platform/internal/cdn"
        "github.com/roycss/platform/internal/certifications"
        "github.com/roycss/platform/internal/challenges"
        "github.com/roycss/platform/internal/cloud"
        "github.com/roycss/platform/internal/colorspace"
        "github.com/roycss/platform/internal/compliance"
        "github.com/roycss/platform/internal/contact"
        "github.com/roycss/platform/internal/deploy"
        "github.com/roycss/platform/internal/designer"
        "github.com/roycss/platform/internal/devtools"
        "github.com/roycss/platform/internal/digitaltwin"
        "github.com/roycss/platform/internal/edge"
        "github.com/roycss/platform/internal/effects"
        "github.com/roycss/platform/internal/enterprise"
        "github.com/roycss/platform/internal/fallback"
        "github.com/roycss/platform/internal/fleet"
        "github.com/roycss/platform/internal/generator"
        "github.com/roycss/platform/internal/governance"
        "github.com/roycss/platform/internal/health"
        "github.com/roycss/platform/internal/icons"
        "github.com/roycss/platform/internal/initialletter"
        "github.com/roycss/platform/internal/inspector"
        "github.com/roycss/platform/internal/lightdark"
        "github.com/roycss/platform/internal/live"
        "github.com/roycss/platform/internal/logicalproperties"
        "github.com/roycss/platform/internal/marketplace"
        "github.com/roycss/platform/internal/mcp"
        "github.com/roycss/platform/internal/mentor"
        "github.com/roycss/platform/internal/motion"
        "github.com/roycss/platform/internal/observatory"
        "github.com/roycss/platform/internal/open"
        osmod "github.com/roycss/platform/internal/os"
        "github.com/roycss/platform/internal/pair"
        "github.com/roycss/platform/internal/patterns"
        "github.com/roycss/platform/internal/pluginhub"
        "github.com/roycss/platform/internal/preview"
        "github.com/roycss/platform/internal/procomponents"
        "github.com/roycss/platform/internal/profiler"
        "github.com/roycss/platform/internal/propertyregistrar"
        "github.com/roycss/platform/internal/recipes"
        "github.com/roycss/platform/internal/refactor"
        "github.com/roycss/platform/internal/registry"
        "github.com/roycss/platform/internal/relativecolor"
        "github.com/roycss/platform/internal/review"
        "github.com/roycss/platform/internal/scaffold"
        "github.com/roycss/platform/internal/scope"
        "github.com/roycss/platform/internal/search"
        "github.com/roycss/platform/internal/spotlight"
        "github.com/roycss/platform/internal/startingstyle"
        "github.com/roycss/platform/internal/storage"
        "github.com/roycss/platform/internal/studio"
        "github.com/roycss/platform/internal/stylequery"
        "github.com/roycss/platform/internal/subgrid"
        syncmod "github.com/roycss/platform/internal/sync"
        "github.com/roycss/platform/internal/textwrap"
        "github.com/roycss/platform/internal/themes"
        "github.com/roycss/platform/internal/version"
        "github.com/roycss/platform/internal/workspace"

        "github.com/roycss/platform/pkg/cache"
        "github.com/roycss/platform/pkg/config"
        "github.com/roycss/platform/pkg/database"
        "github.com/roycss/platform/pkg/httpmw"
        "github.com/roycss/platform/pkg/logger"
)

func main() {
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

        // ── 66 stub modules (return 501 → failover to backend-node) ─────────
        registerStubs(mux,
                academy.RegisterRoutes,
                accessibility.RegisterRoutes,
                analytics.RegisterRoutes,
                architect.RegisterRoutes,
                auditcenter.RegisterRoutes,
                benchmark.RegisterRoutes,
                blocks.RegisterRoutes,
                blueprints.RegisterRoutes,
                bundle.RegisterRoutes,
                cdn.RegisterRoutes,
                certifications.RegisterRoutes,
                challenges.RegisterRoutes,
                cloud.RegisterRoutes,
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
                motion.RegisterRoutes,
                observatory.RegisterRoutes,
                open.RegisterRoutes,
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
