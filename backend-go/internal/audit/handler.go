// Package audit is the Go stub for the "audit" RoyCSS platform module.
//
// Audit routes — /api/v1/audit
//
// Status: STUB — mirrors backend-node/src/modules/audit (mounted at
// API_PREFIX/audit in server/app.ts). This module was missing from the
// Go surface entirely (issue #270), so failover clients hit a mux 404
// instead of the documented failover signal. Note this is distinct from
// the already-stubbed audit-center module (/api/v1/audit-center).
//
// The Node implementation (backend-node) is the running source of truth
// for this module. This Go package establishes the route surface so the
// two backends stay structurally in sync; handlers return 501 Not
// Implemented until the Go port is filled in (see ROYCSS_MIGRATION_GUIDE.md).
package audit

import (
	"net/http"
)

// RegisterRoutes mounts the audit module's routes on the given mux.
// All routes return 501 until the Go implementation is completed.
func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/audit", notImplemented)
	mux.HandleFunc("/api/v1/audit/", notImplemented)
}

// notImplemented responds 501 with a stable JSON envelope so clients
// (Next.js, RoyCLI, MCP) can detect an unported module and fall back
// to the Node backend per the dual-backend failover design.
func notImplemented(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	_, _ = w.Write([]byte(`{"error":{"code":"NOT_IMPLEMENTED","message":"Go stub — use backend-node for this module","module":"audit"}}`))
}
