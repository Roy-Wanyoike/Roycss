// Package response provides the stable JSON envelope used across all
// RoyCSS Go API endpoints, matching the Node backend's contract:
//
//	List:    {"data": [...], "meta": {"count": N, ...}}
//	Single:  {"data": {...}}
//	Error:   {"error": {"code": "...", "message": "...", "details": {...}},
//	          "requestId": "..."}
//
// Error codes are the STABLE node vocabulary (issue #270):
// backend-node/src/server/middleware/error.ts:34-52 — clients fail over
// between backends and must see identical codes. Error envelopes carry the
// per-request id, mirroring node's errorHandler (error.ts:299-322).
package response

import (
	"encoding/json"
	"net/http"
)

// Error codes — the stable node enum (backend-node error.ts:34-52).
// Do NOT invent new codes; add them to the node enum first.
const (
	CodeValidation         = "VALIDATION_ERROR"     // 400
	CodeBadRequest         = "BAD_REQUEST"          // 400
	CodeUnauthorized       = "UNAUTHORIZED"         // 401
	CodeForbidden          = "FORBIDDEN"            // 403
	CodeNotFound           = "NOT_FOUND"            // 404
	CodeConflict           = "CONFLICT"             // 409
	CodeRateLimited        = "RATE_LIMITED"         // 429
	CodeInternal           = "INTERNAL_ERROR"       // 500
	CodeServiceUnavailable = "SERVICE_UNAVAILABLE"  // 503
)

// OK writes a 200 with a single-item envelope: {"data": v}.
func OK(w http.ResponseWriter, v interface{}) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": v})
}

// Created writes a 201 with a single-item envelope.
func Created(w http.ResponseWriter, v interface{}) {
	writeJSON(w, http.StatusCreated, map[string]interface{}{"data": v})
}

// List writes a 200 with a list envelope: {"data": [...], "meta": {...}}.
func List(w http.ResponseWriter, items interface{}, meta interface{}) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data": items,
		"meta": meta,
	})
}

// NoContent writes a 204.
func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// Error writes an error envelope with the given status + node-vocab code +
// message. The envelope carries the requestId injected by the RequestID
// middleware when present (node error.ts:313-320 shape).
func Error(w http.ResponseWriter, status int, code, message string) {
	writeError(w, status, code, message, nil)
}

// Errorf writes an error envelope with formatted details.
func Errorf(w http.ResponseWriter, status int, code, message string, details interface{}) {
	writeError(w, status, code, message, details)
}

// writeError assembles the node error shape. The per-request id is read
// back from the X-Request-Id response header, which the RequestID
// middleware (pkg/http) sets before handlers run — no context plumbing
// needed. Mirrors node's requestId resolution (error.ts:191-192).
func writeError(w http.ResponseWriter, status int, code, message string, details interface{}) {
	errBody := map[string]interface{}{
		"code":    code,
		"message": message,
	}
	if details != nil {
		errBody["details"] = details
	}
	body := map[string]interface{}{"error": errBody}
	if id := w.Header().Get("X-Request-Id"); id != "" {
		body["requestId"] = id
	}
	writeJSON(w, status, body)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
