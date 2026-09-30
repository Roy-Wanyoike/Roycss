// Package openapi is the Go stub for the "openapi" RoyCSS platform module.
//
// OpenAPI document route — /api/v1/openapi.json
//
// Status: STUB — mirrors backend-node/src/modules/openapi (mounted at
// API_PREFIX/openapi.json in server/app.ts; the node implementation serves
// backend-node/api/openapi.json). This module was missing from the Go
// surface entirely (issue #270), so failover clients hit a mux 404 instead
// of the documented failover signal.
//
// The Node implementation (backend-node) is the running source of truth
// for this module. This Go package establishes the route surface so the
// two backends stay structurally in sync; handlers return 501 Not
// Implemented until the Go port is filled in (see ROYCSS_MIGRATION_GUIDE.md).
package openapi

import (
	"net/http"
)

// RegisterRoutes mounts the openapi module's route on the given mux.
// The route returns 501 until the Go implementation is completed.
func RegisterRoutes(mux *http.ServeMux) {
	// Exact match only: node serves the document at /api/v1/openapi.json
	// (a file path, not a collection — no subtree pattern).
	mux.HandleFunc("/api/v1/openapi.json", notImplemented)
}

// notImplemented responds 501 with a stable JSON envelope so clients
// (Next.js, RoyCLI, MCP) can detect an unported module and fall back
// to the Node backend per the dual-backend failover design.
func notImplemented(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	_, _ = w.Write([]byte(`{"error":{"code":"NOT_IMPLEMENTED","message":"Go stub — use backend-node for this module","module":"openapi"}}`))
}
