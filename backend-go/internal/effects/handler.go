package effects

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type Effect struct {
	ID          string `json:"id"`
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	CSSCode     string `json:"cssCode"`
	PreviewType string `json:"previewType"`
}

type ListResponse struct {
	Data []Effect   `json:"data"`
	Meta PageMeta   `json:"meta"`
}

type PageMeta struct {
	Total     int `json:"total"`
	Page      int `json:"page"`
	Limit     int `json:"limit"`
	TotalPages int `json:"totalPages"`
}

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/effects", ListEffects)
	mux.HandleFunc("/api/v1/effects/", GetEffect)
}

func ListEffects(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 { page = 1 }
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 { limit = 20 }

	// Placeholder: replace with database query
	resp := ListResponse{
		Data: []Effect{},
		Meta: PageMeta{Total: 1959, Page: page, Limit: limit, TotalPages: (1959 + limit - 1) / limit},
	}
	writeJSON(w, http.StatusOK, resp)
}

func GetEffect(w http.ResponseWriter, r *http.Request) {
	// Placeholder: extract slug from path and return single effect
	writeJSON(w, http.StatusNotFound, map[string]interface{}{
		"error": map[string]string{"code": "NOT_FOUND", "message": "Effect not found"},
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
