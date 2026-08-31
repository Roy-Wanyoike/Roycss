// Package recipes is the Go stub for the "recipes" RoyCSS platform module.
//
// Recipes routes — /api/v1/recipes
//
// Status: STUB — mirrors backend-node/src/modules/recipes.
// The Node implementation (backend-node) is the running source of truth
// for this module. This Go package establishes the route surface so the
// two backends stay structurally in sync; handlers return 501 Not
// Implemented until the Go port is filled in (see ROYCSS_MIGRATION_GUIDE.md).
package recipes

import (
	"net/http"
)

// RegisterRoutes mounts the recipes module's routes on the given mux.
// All routes return 501 until the Go implementation is completed.
func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/recipes", notImplemented)
	mux.HandleFunc("/api/v1/recipes/", notImplemented)
}

// notImplemented responds 501 with a stable JSON envelope so clients
// (Next.js, RoyCLI, MCP) can detect an unported module and fall back
// to the Node backend per the dual-backend failover design.
func notImplemented(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	_, _ = w.Write([]byte(`{"error":{"code":"NOT_IMPLEMENTED","message":"Go stub — use backend-node for this module","module":"recipes"}}`))
}
