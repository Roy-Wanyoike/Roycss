# API Keys / Credentials Required From Me

These are the external service credentials needed for full production functionality.
All modules use **mock fallback** when keys are not set — the platform works without them,
but setting them upgrades from mock to real API calls.

## Required for Development + Production

### 1. Supabase (Database + Auth)
| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Client-side Supabase access (anon key) |
| `SUPABASE_SECRET_KEY` | Server-side Supabase access (service role key, bypasses RLS) |
| `SUPABASE_JWKS_URL` | JWKS endpoint for verifying Supabase-issued JWTs |

**Status**: Already configured in `backend/.env` with your Supabase credentials.
**Required for**: Development (SQLite fallback works) + Production (Postgres)
**Obtain from**: https://app.supabase.com/project/_/settings/api

---

## Optional — Modules use mock fallback when not set

### 2. OpenAI API Key (LLM modules)
| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | LLM calls for architect, designer, mentor, pair, review modules |

**Required for**: Production only (mock fallback works in dev)
**Obtain from**: https://platform.openai.com/api-keys

### 3. Anthropic API Key (LLM modules — alternative to OpenAI)
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | LLM calls for architect, designer, mentor, pair, review modules |

**Required for**: Production only (mock fallback works in dev)
**Obtain from**: https://console.anthropic.com/settings/keys

### 4. Resend API Key (Email)
| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Transactional email for contact form submissions |

**Required for**: Production only (contact form persists to DB regardless)
**Obtain from**: https://resend.com/api-keys

### 5. Sentry DSN (Error tracking)
| Variable | Purpose |
|---|---|
| `SENTRY_DSN` | Error tracking and observability |

**Required for**: Production only (optional)
**Obtain from**: https://sentry.io/settings/<org>/projects/<project>/keys/

### 6. S3-Compatible Storage
| Variable | Purpose |
|---|---|
| `STORAGE_ENDPOINT` | S3/R2/GCS/MinIO endpoint URL |
| `STORAGE_BUCKET` | Bucket name |
| `STORAGE_ACCESS_KEY_ID` | Access key |
| `STORAGE_SECRET_ACCESS_KEY` | Secret key |
| `STORAGE_REGION` | Region (e.g., us-east-1) |

**Required for**: Production only (mock fallback works in dev)
**Obtain from**: Your S3/R2/GCS provider dashboard

### 7. CDN API
| Variable | Purpose |
|---|---|
| `CDN_API_TOKEN` | Cloudflare or Fastly API token |
| `CDN_PROVIDER` | "cloudflare" or "fastly" |

**Required for**: Production only (mock fallback works in dev)
**Obtain from**: Cloudflare: https://dash.cloudflare.com/profile/api-tokens · Fastly: https://manage.fastly.com/account/tokens

### 8. Figma + GitHub Sync
| Variable | Purpose |
|---|---|
| `FIGMA_TOKEN` | Figma REST API access for design-to-code sync |
| `GITHUB_TOKEN` | GitHub REST API access for repo sync |

**Required for**: Production only (mock fallback works in dev)
**Obtain from**: Figma: https://www.figma.com/developers/api#access-tokens · GitHub: https://github.com/settings/tokens

### 9. npm Registry Token
| Variable | Purpose |
|---|---|
| `NPM_TOKEN` | npm registry access for private packages (public works without token) |

**Required for**: Production only (public packages work without token)
**Obtain from**: https://www.npmjs.com/settings/<username>/tokens

---

## Already Configured

The following are already set in `backend/.env` (gitignored) and `backend/.env.example` (committed with empty values):
- Server config (PORT, LOG_LEVEL, CORS_ORIGINS)
- Database (DATABASE_URL — SQLite for dev)
- JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- Rate limiting (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_*)
- Effects data path (EFFECTS_DATA_PATH)
- All Supabase keys (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_JWKS_URL)

## Summary

| # | Credential | Required For | Currently Set? |
|---|---|---|---|
| 1 | SUPABASE_URL | Dev + Prod | ✅ Yes |
| 2 | SUPABASE_PUBLISHABLE_KEY | Dev + Prod | ✅ Yes |
| 3 | SUPABASE_SECRET_KEY | Dev + Prod | ✅ Yes |
| 4 | SUPABASE_JWKS_URL | Dev + Prod | ✅ Yes |
| 5 | OPENAI_API_KEY | Prod only | ❌ No (mock fallback) |
| 6 | ANTHROPIC_API_KEY | Prod only | ❌ No (mock fallback) |
| 7 | RESEND_API_KEY | Prod only | ❌ No (DB persistence works) |
| 8 | SENTRY_DSN | Prod only | ❌ No (optional) |
| 9 | STORAGE_* (5 vars) | Prod only | ❌ No (mock fallback) |
| 10 | CDN_API_TOKEN + CDN_PROVIDER | Prod only | ❌ No (mock fallback) |
| 11 | FIGMA_TOKEN | Prod only | ❌ No (mock fallback) |
| 12 | GITHUB_TOKEN | Prod only | ❌ No (mock fallback) |
| 13 | NPM_TOKEN | Prod only | ❌ No (public works without) |
