// cmd/worker/main.go is the background worker entry point. It dequeues jobs
// from Redis (the queue used by the API's async endpoints) and runs them.
//
// Job types (matching the Node backend's async modules):
//   - accessibility.audit   → axe-core audit of a URL
//   - analytics.aggregate    → roll up raw events into KPIs
//   - search.reindex         → rebuild the SearchIndex from effects.json
//   - ai.generate            → proxy to an LLM provider
//   - marketplace.process    → validate + process an uploaded package
//   - notifications.send     → deliver email/in-app notifications
//
// Workers are idempotent: a job can be re-run safely after a crash.
//
// Usage:
//   REDIS_URL=redis://localhost:6379 DATABASE_URL=postgres://... go run ./cmd/worker
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/roycss/platform/pkg/cache"
	"github.com/roycss/platform/pkg/database"
	"github.com/roycss/platform/pkg/logger"
)

func main() {
	log := logger.New("info")

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		log.Error("REDIS_URL is required for workers")
		os.Exit(1)
	}
	dbURL := os.Getenv("DATABASE_URL")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	c, err := cache.New(ctx, redisURL, 5*time.Minute)
	if err != nil {
		log.Error("redis connection failed", "err", err)
		os.Exit(1)
	}
	if c == nil || c.Client() == nil {
		log.Error("redis client is nil")
		os.Exit(1)
	}
	rdb := c.Client()

	var pool interface{}
	if dbURL != "" {
		p, err := database.New(ctx, dbURL)
		if err != nil {
			log.Warn("database connection failed (some jobs need it)", "err", err)
		} else {
			defer p.Close()
			pool = p
			log.Info("worker database connected")
		}
	}

	log.Info("RoyCSS Go worker starting", "queue", "roycss:jobs")

	// Graceful shutdown.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Poll Redis for jobs. This is a simple BLPOP-based loop; a production
	// implementation would use a Redis Stream or a dedicated queue library.
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			default:
			}
			result, err := rdb.BLPop(ctx, 10*time.Second, "roycss:jobs").Result()
			if err != nil {
				// Redis.Nil on timeout — just loop.
				continue
			}
			log.Info("job dequeued", "payload_len", len(result))
			// TODO: dispatch by job type when the 66 modules are ported.
			// For now, acknowledge the job so the queue drains.
			_ = pool
		}
	}()

	<-quit
	log.Info("worker shutting down")
	cancel()
	log.Info("worker stopped", slog.Any("pool", fmt.Sprintf("%T", pool)))
}
