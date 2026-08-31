// Package auth implements the auth domain module: signup, login, refresh, me.
//
// Dependency direction: handler → service → repository (pgx). Passwords are
// bcrypt-hashed; tokens are JWT (access 15m + refresh 7d). The repository
// uses the users table created by database/sql/002_users.sql.
package auth

import (
        "context"
        "encoding/json"
        "net/http"
        "strings"
        "time"

        "github.com/jackc/pgx/v5"
        "github.com/jackc/pgx/v5/pgxpool"
        authpkg "github.com/roycss/platform/pkg/auth"
        "github.com/roycss/platform/pkg/config"
        "github.com/roycss/platform/pkg/httpmw"
        "github.com/roycss/platform/pkg/response"
)

// User is the public user record (never includes passwordHash).
type User struct {
        ID        string    `json:"id"`
        Email     string    `json:"email"`
        Name      string    `json:"name,omitempty"`
        CreatedAt time.Time `json:"createdAt"`
        UpdatedAt time.Time `json:"updatedAt"`
}

// Service holds the module's dependencies.
type Service struct {
        pool *pgxpool.Pool
        cfg  *config.Config
}

// New returns a wired auth Service.
func New(pool *pgxpool.Pool, cfg *config.Config) *Service {
        return &Service{pool: pool, cfg: cfg}
}

// RegisterRoutes mounts /api/v1/auth/* on the mux.
func (s *Service) RegisterRoutes(mux *http.ServeMux) {
        mux.HandleFunc("/api/v1/auth/signup", s.signup)
        mux.HandleFunc("/api/v1/auth/login", s.login)
        mux.HandleFunc("/api/v1/auth/refresh", s.refresh)
        mux.HandleFunc("/api/v1/auth/me", s.me)
}

// --- DTOs ---

type signupReq struct {
        Email    string `json:"email"`
        Password string `json:"password"`
        Name     string `json:"name"`
}
type loginReq struct {
        Email    string `json:"email"`
        Password string `json:"password"`
}
type refreshReq struct {
        RefreshToken string `json:"refreshToken"`
}
type tokenResp struct {
        AccessToken  string `json:"accessToken"`
        RefreshToken string `json:"refreshToken"`
        User         User   `json:"user"`
}

// --- Handlers ---

func (s *Service) signup(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                response.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "use POST")
                return
        }
        var req signupReq
        if err := decodeJSON(r, &req); err != nil {
                response.Error(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
                return
        }
        req.Email = strings.TrimSpace(strings.ToLower(req.Email))
        if req.Email == "" {
                response.Error(w, http.StatusBadRequest, "VALIDATION", "email is required")
                return
        }

        hash, err := authpkg.HashPassword(req.Password)
        if err != nil {
                response.Error(w, http.StatusBadRequest, "VALIDATION", err.Error())
                return
        }

        var u User
        err = s.pool.QueryRow(r.Context(), `
                INSERT INTO users (email, password_hash, name)
                VALUES ($1, $2, $3)
                RETURNING id, email, name, created_at, updated_at
        `, req.Email, hash, req.Name).Scan(&u.ID, &u.Email, &u.Name, &u.CreatedAt, &u.UpdatedAt)
        if err != nil {
                if isUniqueViolation(err) {
                        response.Error(w, http.StatusConflict, "DUPLICATE", "email already registered")
                        return
                }
                response.Error(w, http.StatusInternalServerError, "INTERNAL", "failed to create user")
                return
        }

        resp, err := s.issueTokens(u)
        if err != nil {
                response.Error(w, http.StatusInternalServerError, "INTERNAL", "failed to mint tokens")
                return
        }
        response.Created(w, resp)
}

func (s *Service) login(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                response.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "use POST")
                return
        }
        var req loginReq
        if err := decodeJSON(r, &req); err != nil {
                response.Error(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
                return
        }
        req.Email = strings.TrimSpace(strings.ToLower(req.Email))

        var u User
        var hash string
        err := s.pool.QueryRow(r.Context(), `
                SELECT id, email, name, password_hash, created_at, updated_at
                FROM users WHERE email = $1
        `, req.Email).Scan(&u.ID, &u.Email, &u.Name, &hash, &u.CreatedAt, &u.UpdatedAt)
        if err == pgx.ErrNoRows {
                response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password")
                return
        }
        if err != nil {
                response.Error(w, http.StatusInternalServerError, "INTERNAL", "failed to query user")
                return
        }
        if err := authpkg.VerifyPassword(hash, req.Password); err != nil {
                response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password")
                return
        }

        resp, err := s.issueTokens(u)
        if err != nil {
                response.Error(w, http.StatusInternalServerError, "INTERNAL", "failed to mint tokens")
                return
        }
        response.OK(w, resp)
}

func (s *Service) refresh(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                response.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "use POST")
                return
        }
        var req refreshReq
        if err := decodeJSON(r, &req); err != nil {
                response.Error(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
                return
        }
        claims, err := authpkg.VerifyRefresh(s.cfg.JWTRefreshSecret, req.RefreshToken)
        if err != nil {
                response.Error(w, http.StatusUnauthorized, "INVALID_TOKEN", "refresh token invalid or expired")
                return
        }
        var u User
        err = s.pool.QueryRow(r.Context(), `
                SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1
        `, claims.Subject).Scan(&u.ID, &u.Email, &u.Name, &u.CreatedAt, &u.UpdatedAt)
        if err != nil {
                response.Error(w, http.StatusUnauthorized, "INVALID_TOKEN", "user not found")
                return
        }
        resp, err := s.issueTokens(u)
        if err != nil {
                response.Error(w, http.StatusInternalServerError, "INTERNAL", "failed to mint tokens")
                return
        }
        response.OK(w, resp)
}

func (s *Service) me(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodGet {
                response.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "use GET")
                return
        }
        bearer := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
        claims, err := authpkg.VerifyAccess(s.cfg.JWTSecret, bearer)
        if err != nil {
                response.Error(w, http.StatusUnauthorized, "UNAUTHENTICATED", "missing or invalid token")
                return
        }
        var u User
        err = s.pool.QueryRow(r.Context(), `
                SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1
        `, claims.UserID).Scan(&u.ID, &u.Email, &u.Name, &u.CreatedAt, &u.UpdatedAt)
        if err != nil {
                response.Error(w, http.StatusUnauthorized, "UNAUTHENTICATED", "user not found")
                return
        }
        ctx := context.WithValue(r.Context(), httpmw.CtxUserID, u.ID)
        _ = ctx
        response.OK(w, u)
}

// --- helpers ---

func (s *Service) issueTokens(u User) (tokenResp, error) {
        access, err := authpkg.MintAccess(s.cfg.JWTSecret, u.ID, u.Email, s.cfg.JWTExpiresIn)
        if err != nil {
                return tokenResp{}, err
        }
        refresh, err := authpkg.MintRefresh(s.cfg.JWTRefreshSecret, u.ID, s.cfg.JWTRefreshExpiresIn)
        if err != nil {
                return tokenResp{}, err
        }
        return tokenResp{AccessToken: access, RefreshToken: refresh, User: u}, nil
}

func decodeJSON(r *http.Request, v interface{}) error {
        return json.NewDecoder(r.Body).Decode(v)
}

// isUniqueViolation checks for a Postgres unique constraint violation.
func isUniqueViolation(err error) bool {
        return err != nil && strings.Contains(err.Error(), "23505")
}
