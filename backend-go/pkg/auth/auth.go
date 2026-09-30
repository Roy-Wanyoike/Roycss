// Package auth provides JWT access + refresh tokens and bcrypt password
// hashing for the RoyCSS Go API. Mirrors the Node backend's auth contract
// (backend-node/src/lib/jwt.ts + src/config/constants.ts):
//
//   POST /api/v1/auth/register { email, password, name } → { user, accessToken, refreshToken }
//   POST /api/v1/auth/login    { email, password }       → { user, accessToken, refreshToken }
//   POST /api/v1/auth/refresh  { refreshToken }           → { accessToken, refreshToken }
//   GET  /api/v1/auth/me       (Bearer)                   → { user }
//
// Token contract (issue #270 — tokens must interoperate BOTH directions):
//   - issuer  "roycss-backend"  (node APP_NAME, constants.ts:14,50)
//   - audience "roycss-client"  (node JWT_CONFIG.audience, constants.ts:51)
//   - user id in the `sub` claim (node AccessTokenPayload, jwt.ts:26-30)
//   - `type` claim distinguishes access ("access") from refresh ("refresh")
//   - HS256 only; verify pins iss/aud/method (node BASE_VERIFY_OPTS, jwt.ts:52-55)
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWT issuer/audience — MUST match backend-node/src/config/constants.ts
// (JWT_CONFIG.issuer = APP_NAME = "roycss-backend", audience "roycss-client").
const (
	Issuer   = "roycss-backend"
	Audience = "roycss-client"
)

// Token-type claims (node jwt.ts AccessTokenPayload/RefreshTokenPayload).
const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// Claims is the JWT payload for access tokens. The user id lives in the
// standard `sub` claim (RegisteredClaims.Subject) — the node backend puts
// it there and failover clients rely on it (issue #270: `uid` was wrong).
type Claims struct {
	Email string `json:"email"`
	Type  string `json:"type"`
	jwt.RegisteredClaims
}

// refreshClaims is the JWT payload for refresh tokens (adds type:"refresh"
// and a jti so two refresh tokens for the same user are never identical —
// node jwt.ts:87-98 signs a random jti for the same reason).
type refreshClaims struct {
	Type string `json:"type"`
	jwt.RegisteredClaims
}

// HashPassword bcrypts a plaintext password (cost 10).
func HashPassword(plain string) (string, error) {
	if len(plain) < 8 {
		return "", errors.New("password must be at least 8 characters")
	}
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(b), nil
}

// VerifyPassword compares a bcrypt hash against plaintext. Returns nil on match.
func VerifyPassword(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}

// MintAccess creates a signed JWT access token.
func MintAccess(secret, userID, email string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		Email: email,
		Type:  TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    Issuer,
			Audience:  jwt.ClaimStrings{Audience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString([]byte(secret))
}

// MintRefresh creates a signed JWT refresh token (longer TTL, same subject).
// Carries type:"refresh" + a random jti, mirroring node jwt.ts:87-98.
func MintRefresh(secret, userID string, ttl time.Duration) (string, error) {
	now := time.Now()
	jti := make([]byte, 16)
	if _, err := rand.Read(jti); err != nil {
		return "", fmt.Errorf("generate refresh jti: %w", err)
	}
	claims := refreshClaims{
		Type: TokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    Issuer,
			Audience:  jwt.ClaimStrings{Audience},
			Subject:   userID,
			ID:        hex.EncodeToString(jti),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString([]byte(secret))
}

// hmacKeyFunc pins the signing method to HS256 (node signs HS256 only;
// an algorithms allowlist on verify closes the alg-switching class).
func hmacKeyFunc(secret string) jwt.Keyfunc {
	return func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	}
}

// VerifyAccess validates an access token and returns the claims.
// Enforces iss + aud + HS256 (node BASE_VERIFY_OPTS, jwt.ts:52-55) and the
// access token type (node jwt.ts:120-128) — a refresh token is NOT a valid
// access token.
func VerifyAccess(secret, tokenStr string) (*Claims, error) {
	claims := &Claims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, hmacKeyFunc(secret),
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithIssuer(Issuer),
		jwt.WithAudience(Audience))
	if err != nil {
		return nil, err
	}
	if !tok.Valid {
		return nil, errors.New("invalid token")
	}
	if claims.Type != TokenTypeAccess {
		return nil, errors.New("invalid token type")
	}
	return claims, nil
}

// VerifyRefresh validates a refresh token (no email claim needed). Enforces
// iss + aud + HS256 + the refresh token type.
func VerifyRefresh(secret, tokenStr string) (*jwt.RegisteredClaims, error) {
	claims := &refreshClaims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, hmacKeyFunc(secret),
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithIssuer(Issuer),
		jwt.WithAudience(Audience))
	if err != nil {
		return nil, err
	}
	if !tok.Valid {
		return nil, errors.New("invalid refresh token")
	}
	if claims.Type != TokenTypeRefresh {
		return nil, errors.New("invalid token type")
	}
	return &claims.RegisteredClaims, nil
}
