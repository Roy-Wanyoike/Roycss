// Package httpmw contains HTTP middleware shared across all domain modules:
// security headers, CORS, request-ID, recover, and auth.
package httpmw

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/roycss/platform/pkg/config"
)

type ctxKey string

const (
	// CtxRequestID is the context key for the per-request ID.
	CtxRequestID ctxKey = "requestId"
	// CtxUserID is the context key for the authenticated user's ID.
	CtxUserID ctxKey = "userId"
)

// SecurityHeaders sets safe-by-default response headers.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}

// CORS handles preflight + sets Access-Control-* headers from config.
func CORS(cfg *config.Config) func(http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, o := range cfg.CORSOrigins {
		allowed[o] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && allowed[origin] {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
				w.Header().Set("Vary", "Origin")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequestID injects a random hex request ID into the context + X-Request-Id
// response header for log correlation.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-Id")
		if id == "" {
			b := make([]byte, 8)
			_, _ = rand.Read(b)
			id = hex.EncodeToString(b)
		}
		w.Header().Set("X-Request-Id", id)
		ctx := context.WithValue(r.Context(), CtxRequestID, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Recover catches panics and returns a 500 without crashing the process.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				// Node-vocab code (error.ts:34-52) + requestId (set on the
				// response header by the inner RequestID middleware before
				// handlers ran, so it survives the panic). The id is echo-safe
				// only in the charset this middleware generates — a hostile
				// inbound X-Request-Id must not be inlined into raw JSON
				// (response.go escapes via json.Marshal; this path does not).
				body := `{"error":{"code":"INTERNAL_ERROR","message":"internal server error"}`
				if id := w.Header().Get("X-Request-Id"); isEchoSafeID(id) {
					body += `,"requestId":"` + id + `"`
				}
				body += `}`
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_, _ = w.Write([]byte(body))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// PathPrefix is a helper to mount a sub-handler under a prefix using the
// stdlib ServeMux (Go 1.22+ pattern matching).
func PathPrefix(mux *http.ServeMux, prefix string, h http.Handler) {
	if !strings.HasSuffix(prefix, "/") {
		prefix += "/"
	}
	mux.Handle(prefix, http.StripPrefix(strings.TrimSuffix(prefix, "/"), h))
}

// isEchoSafeID reports whether id can be inlined into a JSON string
// literal without escaping: the charset the RequestID middleware itself
// generates (hex) plus the dot/hyphen/underscore operators commonly used
// by upstream proxies. Anything else is omitted from the panic envelope.
func isEchoSafeID(id string) bool {
	if len(id) == 0 || len(id) > 128 {
		return false
	}
	for i := 0; i < len(id); i++ {
		c := id[i]
		switch {
		case c >= '0' && c <= '9', c >= 'a' && c <= 'f', c >= 'A' && c <= 'F':
		case c == '.', c == '-', c == '_':
		default:
			return false
		}
	}
	return true
}
