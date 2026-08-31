// Package effects is the RoyCSS effects module — the canonical source for
// CSS effects. Effects are seeded at boot from dist/effects.json (the same
// artifact the Node backend reads), kept in memory for O(1) reads, and
// optionally cached in Redis. This module has a real Go implementation so
// the Go backend can serve effects independently of the Node backend.
//
// Routes:
//   GET /api/v1/effects            ?category=&tag=&page=&limit=  → list
//   GET /api/v1/effects/{slug}                                    → single
package effects

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/roycss/platform/pkg/cache"
	"github.com/roycss/platform/pkg/response"
)

// Effect mirrors the shape in dist/effects.json.
type Effect struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Category    string   `json:"category"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	PreviewType string   `json:"previewType"`
	PreviewText *string  `json:"previewText"`
	ChildCount  *int     `json:"childCount"`
}

type Service struct {
	mu      sync.RWMutex
	all     []Effect
	bySlug  map[string]Effect
	cache   *cache.Cache
	loaded  bool
	srcPath string
}

// New returns an effects Service that loads from srcPath on first use.
func New(srcPath string, c *cache.Cache) *Service {
	return &Service{srcPath: srcPath, cache: c, bySlug: map[string]Effect{}}
}

// Load reads the effects JSON file into memory. Idempotent.
func (s *Service) Load() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.loaded {
		return nil
	}
	raw, err := os.ReadFile(s.srcPath)
	if err != nil {
		return err
	}
	var arr []Effect
	if err := json.Unmarshal(raw, &arr); err != nil {
		return err
	}
	s.all = arr
	for _, e := range arr {
		s.bySlug[e.ID] = e
	}
	s.loaded = true
	return nil
}

// Count returns the total number of effects.
func (s *Service) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.all)
}

// RegisterRoutes mounts /api/v1/effects and /api/v1/effects/{slug}.
func (s *Service) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/effects", s.list)
	mux.HandleFunc("/api/v1/effects/", s.get)
}

func (s *Service) list(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "use GET")
		return
	}
	if err := s.Load(); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL", "effects data not loaded")
		return
	}
	page := atoiDefault(r.URL.Query().Get("page"), 1)
	limit := atoiDefault(r.URL.Query().Get("limit"), 20)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	category := r.URL.Query().Get("category")
	tag := r.URL.Query().Get("tag")

	s.mu.RLock()
	defer s.mu.RUnlock()

	filtered := s.all
	if category != "" {
		filtered = filter(filtered, func(e Effect) bool { return e.Category == category })
	}
	if tag != "" {
		filtered = filter(filtered, func(e Effect) bool {
			for _, t := range e.Tags {
				if t == tag {
					return true
				}
			}
			return false
		})
	}

	total := len(filtered)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}
	page_items := filtered[start:end]
	if page_items == nil {
		page_items = []Effect{}
	}

	totalPages := 0
	if limit > 0 {
		totalPages = (total + limit - 1) / limit
	}
	response.List(w, page_items, map[string]interface{}{
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "use GET")
		return
	}
	if err := s.Load(); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL", "effects data not loaded")
		return
	}
	slug := strings.TrimPrefix(r.URL.Path, "/api/v1/effects/")
	if slug == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION", "slug is required")
		return
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.bySlug[slug]
	if !ok {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "effect not found")
		return
	}
	response.OK(w, e)
}

func atoiDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func filter(in []Effect, keep func(Effect) bool) []Effect {
	out := in[:0]
	for _, e := range in {
		if keep(e) {
			out = append(out, e)
		}
	}
	return out
}
