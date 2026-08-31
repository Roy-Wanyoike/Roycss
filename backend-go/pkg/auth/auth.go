// Package auth provides JWT access + refresh tokens and bcrypt password
// hashing for the RoyCSS Go API. Mirrors the Node backend's auth contract:
//   POST /api/v1/auth/signup   { email, password, name } → { user, accessToken, refreshToken }
//   POST /api/v1/auth/login    { email, password }       → { user, accessToken, refreshToken }
//   POST /api/v1/auth/refresh  { refreshToken }           → { accessToken, refreshToken }
//   GET  /api/v1/auth/me       (Bearer)                   → { user }
package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Claims is the JWT payload for access tokens.
type Claims struct {
	UserID string `json:"uid"`
	Email string `json:"email"`
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
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "roycss-go-api",
			Audience:  jwt.ClaimStrings{"roycss-client"},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString([]byte(secret))
}

// MintRefresh creates a signed JWT refresh token (longer TTL, same subject).
func MintRefresh(secret, userID string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Issuer:    "roycss-go-api",
		Audience:  jwt.ClaimStrings{"roycss-client"},
		Subject:   userID,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString([]byte(secret))
}

// VerifyAccess validates an access token and returns the claims.
func VerifyAccess(secret, tokenStr string) (*Claims, error) {
	claims := &Claims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// VerifyRefresh validates a refresh token (no email claim needed).
func VerifyRefresh(secret, tokenStr string) (*jwt.RegisteredClaims, error) {
	claims := &jwt.RegisteredClaims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !tok.Valid {
		return nil, errors.New("invalid refresh token")
	}
	return claims, nil
}
