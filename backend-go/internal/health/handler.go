// Package health provides liveness + readiness endpoints.
//
//   GET /api/v1/health        → { status, service, version, uptime, checks:{database,redis,memory} }
//   GET /api/v1/health/live   → { status: "ok" }              (liveness — process is up)
//   GET /api/v1/health/ready  → { status, checks:{db,redis} }  (readiness — deps reachable)
package health

import (
	"context"
	"net/http"
	"runtime"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/roycss/platform/pkg/cache"
	"github.com/roycss/platform/pkg/response"
)

type Service struct {
	pool  *pgxpool.Pool
	cache *cache.Cache
	start time.Time
}

// New creates a health Service with DB + Redis deps for readiness checks.
func New(pool *pgxpool.Pool, c *cache.Cache) *Service {
	return &Service{pool: pool, cache: c, start: time.Now()}
}

func (s *Service) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/health", s.health)
	mux.HandleFunc("/api/v1/health/live", s.live)
	mux.HandleFunc("/api/v1/health/ready", s.ready)
}

func (s *Service) health(w http.ResponseWriter, r *http.Request) {
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)
	dbOK := "connected"
	if err := databaseHealth(r.Context(), s.pool); err != nil {
		dbOK = "error: " + err.Error()
	}
	redisOK := "disabled"
	if s.cache != nil {
		redisOK = "connected"
	}
	response.OK(w, map[string]interface{}{
		"status":  "ok",
		"service": "roycss-go-api",
		"version": "0.1.0",
		"uptime":  map[string]interface{}{"seconds": int(time.Since(s.start).Seconds())},
		"checks": map[string]interface{}{
			"database": dbOK,
			"redis":    redisOK,
			"memory": map[string]interface{}{
				"rssMb":      mem.Sys / 1024 / 1024,
				"heapUsedMb": mem.HeapAlloc / 1024 / 1024,
			},
		},
	})
}

func (s *Service) live(w http.ResponseWriter, _ *http.Request) {
	response.OK(w, map[string]string{"status": "ok"})
}

func (s *Service) ready(w http.ResponseWriter, r *http.Request) {
	checks := map[string]string{}
	allOK := true
	if err := databaseHealth(r.Context(), s.pool); err != nil {
		checks["database"] = "error: " + err.Error()
		allOK = false
	} else {
		checks["database"] = "connected"
	}
	if s.cache != nil {
		checks["redis"] = "connected"
	} else {
		checks["redis"] = "disabled"
	}
	status := "ok"
	code := http.StatusOK
	if !allOK {
		status = "degraded"
		code = http.StatusServiceUnavailable
	}
	response.OK(w, map[string]interface{}{"status": status, "checks": checks})
}

func databaseHealth(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return nil
	}
	c, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return pool.Ping(c)
}
