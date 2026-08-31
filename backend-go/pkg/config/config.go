// Package config loads and validates environment variables for the RoyCSS Go API.
//
// Fails fast on missing/invalid config at boot — the same discipline as the
// Node backend's Zod-validated env. Every env var has an explicit default
// where a sensible one exists, and a clear error when one does not.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config is the validated application configuration.
type Config struct {
	NodeEnv     string
	Port        string
	LogLevel    string
	CORSOrigins []string

	// Database (PostgreSQL via pgx)
	DatabaseURL string

	// Redis
	RedisURL string

	// JWT
	JWTSecret           string
	JWTRefreshSecret    string
	JWTExpiresIn        time.Duration
	JWTRefreshExpiresIn time.Duration

	// Rate limiting
	RateLimitWindowMs int
	RateLimitMax      int

	// Effects data (seed source)
	EffectsDataPath string

	// Storage (S3-compatible)
	StorageEndpoint  string
	StorageBucket    string
	StorageAccessKey string
	StorageSecretKey string
	StorageRegion    string
}

// Load reads env vars and validates them. Returns an error on fatal misconfig.
func Load() (*Config, error) {
	c := &Config{
		NodeEnv:   env("NODE_ENV", "development"),
		Port:      env("PORT", "4000"),
		LogLevel:  env("LOG_LEVEL", "info"),

		DatabaseURL: env("DATABASE_URL", ""),
		RedisURL:    env("REDIS_URL", ""),

		JWTSecret:        env("JWT_SECRET", ""),
		JWTRefreshSecret: env("JWT_REFRESH_SECRET", ""),

		RateLimitWindowMs: envInt("RATE_LIMIT_WINDOW_MS", 60000),
		RateLimitMax:      envInt("RATE_LIMIT_MAX_GENERAL", 100),

		EffectsDataPath: env("EFFECTS_DATA_PATH", "../dist/effects.json"),

		StorageEndpoint:  env("STORAGE_ENDPOINT", ""),
		StorageBucket:    env("STORAGE_BUCKET", ""),
		StorageAccessKey: env("STORAGE_ACCESS_KEY", ""),
		StorageSecretKey: env("STORAGE_SECRET_KEY", ""),
		StorageRegion:    env("STORAGE_REGION", "auto"),
	}

	c.CORSOrigins = strings.Split(env("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"), ",")
	for i := range c.CORSOrigins {
		c.CORSOrigins[i] = strings.TrimSpace(c.CORSOrigins[i])
	}

	var err error
	c.JWTExpiresIn, err = time.ParseDuration(env("JWT_EXPIRES_IN", "15m"))
	if err != nil {
		return nil, fmt.Errorf("JWT_EXPIRES_IN: %w", err)
	}
	c.JWTRefreshExpiresIn, err = time.ParseDuration(env("JWT_REFRESH_EXPIRES_IN", "168h"))
	if err != nil {
		return nil, fmt.Errorf("JWT_REFRESH_HIRES_IN: %w", err)
	}

	if c.NodeEnv != "test" {
		if c.DatabaseURL == "" {
			return nil, fmt.Errorf("DATABASE_URL is required")
		}
		if len(c.JWTSecret) < 16 {
			return nil, fmt.Errorf("JWT_SECRET must be at least 16 characters")
		}
		if len(c.JWTRefreshSecret) < 16 {
			return nil, fmt.Errorf("JWT_REFRESH_SECRET must be at least 16 characters")
		}
	}

	return c, nil
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}
