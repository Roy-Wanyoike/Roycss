// Package cache wraps go-redis with a typed Get-or-Set helper and explicit
// TTL + invalidation. Redis is NEVER the source of truth — every cache miss
// falls through to PostgreSQL; a Redis outage degrades to slower reads, not
// an outage.
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	client *redis.Client
	ttl    time.Duration
}

// New connects to Redis. If redisURL is empty, returns nil (caching disabled;
// callers must nil-check). A failed Ping returns an error.
func New(ctx context.Context, redisURL string, defaultTTL time.Duration) (*Cache, error) {
	if redisURL == "" {
		return nil, nil
	}
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}
	client := redis.NewClient(opts)
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}
	return &Cache{client: client, ttl: defaultTTL}, nil
}

// Get retrieves a cached JSON value into dst. Returns (false, nil) on miss.
func (c *Cache) Get(ctx context.Context, key string, dst interface{}) (bool, error) {
	if c == nil || c.client == nil {
		return false, nil
	}
	raw, err := c.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, json.Unmarshal(raw, dst)
}

// Set stores a JSON value with the cache's default TTL.
func (c *Cache) Set(ctx context.Context, key string, value interface{}) error {
	if c == nil || c.client == nil {
		return nil
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key, raw, c.ttl).Err()
}

// Invalidate deletes keys. Safe to call on a nil cache.
func (c *Cache) Invalidate(ctx context.Context, keys ...string) error {
	if c == nil || c.client == nil {
		return nil
	}
	return c.client.Del(ctx, keys...).Err()
}

// Client exposes the underlying redis.Client for advanced use (rate limiting,
// pub/sub). May be nil if caching is disabled.
func (c *Cache) Client() *redis.Client {
	if c == nil {
		return nil
	}
	return c.client
}
