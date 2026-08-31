# API Keys / Credentials Required

| # | Service | Variable | Required For | Currently |
|---|---|---|---|---|
| 1 | Supabase | SUPABASE_URL | Dev + Prod | ✅ Set |
| 2 | Supabase | SUPABASE_PUBLISHABLE_KEY | Dev + Prod | ✅ Set |
| 3 | Supabase | SUPABASE_SECRET_KEY | Dev + Prod | ✅ Set |
| 4 | Supabase | SUPABASE_JWKS_URL | Dev + Prod | ✅ Set |
| 5 | OpenAI | OPENAI_API_KEY | Prod only | ❌ Mock fallback |
| 6 | Anthropic | ANTHROPIC_API_KEY | Prod only | ❌ Mock fallback |
| 7 | Resend | RESEND_API_KEY | Prod only | ❌ DB persists |
| 8 | Sentry | SENTRY_DSN | Prod only | ❌ Optional |
| 9 | S3/R2/GCS | STORAGE_* (5 vars) | Prod only | ❌ Mock fallback |
| 10 | Cloudflare/Fastly | CDN_API_TOKEN + CDN_PROVIDER | Prod only | ❌ Mock fallback |
| 11 | Figma | FIGMA_TOKEN | Prod only | ❌ Mock fallback |
| 12 | GitHub | GITHUB_TOKEN | Prod only | ❌ Mock fallback |
| 13 | npm | NPM_TOKEN | Prod only | ❌ Public works |

All optional keys use mock fallback — platform works without them.
