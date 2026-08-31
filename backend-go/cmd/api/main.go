// Package main is the entry point for the RoyCSS Go API.
//
// RoyCSS runs a DUAL-BACKEND architecture for scaling and failover:
//
//   - backend-node/  — Express + Prisma + SQLite (the running source of
//                      truth; works in any Node environment)
//   - backend-go/    — this package; Go modular monolith (production
//                      target; needs Go 1.23+, PostgreSQL, Redis)
//
// Both backends expose the SAME /api/v1 surface. When the Go backend is
// fully implemented, traffic can be switched (or split) between the two
// per module. Today the Go backend registers all 68 module route surfaces;
// modules not yet ported return 501 so clients fall back to backend-node.
//
// See docs/ROYCSS_BACKEND_ARCHITECTURE.md and
//     docs/ROYCSS_MIGRATION_GUIDE.md for the module-by-module cutover plan.
package main

import (
        "context"
        "log"
        "net/http"
        "os"
        "os/signal"
        "syscall"
        "time"

        "github.com/roycss/platform/internal/academy"
        "github.com/roycss/platform/internal/accessibility"
        "github.com/roycss/platform/internal/analytics"
        "github.com/roycss/platform/internal/architect"
        "github.com/roycss/platform/internal/auditcenter"
        "github.com/roycss/platform/internal/auth"
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
)

func main() {
        port := os.Getenv("PORT")
        if port == "" {
                port = "4000"
        }

        mux := http.NewServeMux()

        // ── Register all 68 domain module routes ────────────────────────────
        // Modules with real Go implementations: health, effects.
        // All other modules are 501 stubs mirroring backend-node/src/modules/*.
        health.RegisterRoutes(mux)
        effects.RegisterRoutes(mux)
        academy.RegisterRoutes(mux)
        accessibility.RegisterRoutes(mux)
        analytics.RegisterRoutes(mux)
        architect.RegisterRoutes(mux)
        auditcenter.RegisterRoutes(mux)
        auth.RegisterRoutes(mux)
        benchmark.RegisterRoutes(mux)
        blocks.RegisterRoutes(mux)
        blueprints.RegisterRoutes(mux)
        bundle.RegisterRoutes(mux)
        cdn.RegisterRoutes(mux)
        certifications.RegisterRoutes(mux)
        challenges.RegisterRoutes(mux)
        cloud.RegisterRoutes(mux)
        colorspace.RegisterRoutes(mux)
        compliance.RegisterRoutes(mux)
        contact.RegisterRoutes(mux)
        deploy.RegisterRoutes(mux)
        designer.RegisterRoutes(mux)
        devtools.RegisterRoutes(mux)
        digitaltwin.RegisterRoutes(mux)
        edge.RegisterRoutes(mux)
        enterprise.RegisterRoutes(mux)
        fallback.RegisterRoutes(mux)
        fleet.RegisterRoutes(mux)
        generator.RegisterRoutes(mux)
        governance.RegisterRoutes(mux)
        icons.RegisterRoutes(mux)
        initialletter.RegisterRoutes(mux)
        inspector.RegisterRoutes(mux)
        lightdark.RegisterRoutes(mux)
        live.RegisterRoutes(mux)
        logicalproperties.RegisterRoutes(mux)
        marketplace.RegisterRoutes(mux)
        mcp.RegisterRoutes(mux)
        mentor.RegisterRoutes(mux)
        motion.RegisterRoutes(mux)
        observatory.RegisterRoutes(mux)
        open.RegisterRoutes(mux)
        osmod.RegisterRoutes(mux)
        pair.RegisterRoutes(mux)
        patterns.RegisterRoutes(mux)
        pluginhub.RegisterRoutes(mux)
        preview.RegisterRoutes(mux)
        procomponents.RegisterRoutes(mux)
        profiler.RegisterRoutes(mux)
        propertyregistrar.RegisterRoutes(mux)
        recipes.RegisterRoutes(mux)
        refactor.RegisterRoutes(mux)
        registry.RegisterRoutes(mux)
        relativecolor.RegisterRoutes(mux)
        review.RegisterRoutes(mux)
        scaffold.RegisterRoutes(mux)
        scope.RegisterRoutes(mux)
        search.RegisterRoutes(mux)
        spotlight.RegisterRoutes(mux)
        startingstyle.RegisterRoutes(mux)
        storage.RegisterRoutes(mux)
        studio.RegisterRoutes(mux)
        stylequery.RegisterRoutes(mux)
        subgrid.RegisterRoutes(mux)
        syncmod.RegisterRoutes(mux)
        textwrap.RegisterRoutes(mux)
        themes.RegisterRoutes(mux)
        version.RegisterRoutes(mux)
        workspace.RegisterRoutes(mux)

        handler := withSecurityHeaders(mux)

        server := &http.Server{
                Addr:         ":" + port,
                Handler:      handler,
                ReadTimeout:  10 * time.Second,
                WriteTimeout: 30 * time.Second,
                IdleTimeout:  120 * time.Second,
        }

        go func() {
                log.Printf("RoyCSS Go API (dual-backend) starting on :%s — stubs return 501, use backend-node for now", port)
                if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
                        log.Fatalf("Server failed: %v", err)
                }
        }()

        quit := make(chan os.Signal, 1)
        signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
        <-quit
        log.Println("Shutting down...")

        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        _ = server.Shutdown(ctx)
        log.Println("Stopped")
}

func withSecurityHeaders(h http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                w.Header().Set("X-Content-Type-Options", "nosniff")
                w.Header().Set("X-Frame-Options", "DENY")
                w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
                w.Header().Set("Access-Control-Allow-Origin", "*")
                w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
                w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
                if r.Method == http.MethodOptions {
                        w.WriteHeader(http.StatusOK)
                        return
                }
                h.ServeHTTP(w, r)
        })
}
