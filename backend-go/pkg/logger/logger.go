// Package logger provides structured JSON logging via the standard library
// log/slog. Output is newline-delimited JSON suitable for any log aggregator.
package logger

import (
	"log/slog"
	"os"
	"strings"
)

// New returns a slog.Logger configured for the given level string
// ("debug" | "info" | "warn" | "error").
func New(level string) *slog.Logger {
	var lvl slog.Level
	switch strings.ToLower(level) {
	case "debug":
		lvl = slog.LevelDebug
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}

	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})
	return slog.New(handler).With("service", "roycss-go-api")
}
