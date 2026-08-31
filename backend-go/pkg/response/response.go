// Package response provides the stable JSON envelope used across all
// RoyCSS Go API endpoints, matching the Node backend's contract:
//
//   List:    {"data": [...], "meta": {"count": N, ...}}
//   Single:  {"data": {...}}
//   Error:   {"error": {"code": "...", "message": "...", "details": {...}}}
package response

import (
	"encoding/json"
	"net/http"
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

// Error writes an error envelope with the given status + code + message.
func Error(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]interface{}{
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
		},
	})
}

// Errorf writes an error envelope with formatted details.
func Errorf(w http.ResponseWriter, status int, code, message string, details interface{}) {
	writeJSON(w, status, map[string]interface{}{
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
			"details": details,
		},
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
