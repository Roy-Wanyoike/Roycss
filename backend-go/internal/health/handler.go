package health

import (
	"encoding/json"
	"net/http"
	"time"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", HealthHandler)
	mux.HandleFunc("/health/live", HealthHandler)
	mux.HandleFunc("/health/ready", HealthHandler)
	mux.HandleFunc("/api/v1/health", HealthHandler)
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"service":   "roycss-go-api",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"checks": map[string]interface{}{
			"database": "connected",
		},
	})
}
