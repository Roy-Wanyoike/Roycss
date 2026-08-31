# RoyCSS — Go Backend Architecture

## Architecture: Modular Monolith in Go

RoyCSS uses a **Go modular monolith** backend with PostgreSQL + Redis.

```
Next.js (Vercel) → Go API (Cloud Run/Render) → PostgreSQL + Redis + S3
```

## Structure

```
backend/go/
├── cmd/
│   ├── api/main.go          # HTTP API server
│   ├── worker/main.go       # Background workers
│   └── migrate/main.go      # Database migrations
├── internal/
│   ├── auth/                 # Authentication (JWT + bcrypt)
│   ├── users/               # User accounts
│   ├── organizations/        # Orgs + teams + roles
│   ├── effects/             # CSS effects (1,959)
│   ├── components/           # UI components
│   ├── patterns/             # Design patterns
│   ├── collections/          # Curated collections
│   ├── recipes/              # Solution recipes
│   ├── themes/              # Theme system
│   ├── tokens/              # Design tokens
│   ├── marketplace/         # Template marketplace
│   ├── ai/                   # RoyAI (LLM abstraction)
│   ├── mcp/                 # MCP server
│   ├── search/               # Full-text search
│   ├── billing/              # Subscriptions + payments
│   └── health/               # Health checks
├── pkg/
│   ├── database/             # PostgreSQL connection pool
│   ├── redis/                # Redis client
│   ├── storage/              # S3-compatible storage
│   └── logger/               # Structured logging
└── Dockerfile               # Container deployment

database/sql/
├── 001_extensions.sql       # UUID + pgcrypto
├── 002_users.sql            # Users table
├── 003_organizations.sql    # Orgs + teams + members
├── 004_projects.sql          # Projects
├── 005_taxonomy.sql          # Categories + tags
├── 006_effects.sql           # 1,959 CSS effects
├── 007_components.sql       # UI components
├── 008_patterns.sql          # Design patterns
├── 009_collections.sql      # Collections + items
├── 010_recipes.sql           # Solution recipes
├── 011_themes.sql            # Design tokens + themes
├── 012_marketplace.sql       # Marketplace products + reviews
├── 013_api_keys.sql          # API keys
└── 014_favorites.sql         # User favorites
```

## Go Engineering

- `net/http` standard library
- No heavy frameworks
- Domain modules with handler/service/repository separation
- `pgx` for PostgreSQL
- `go-redis` for Redis
- OpenTelemetry for observability
- Structured logging
- Graceful shutdown
- Security headers (CORS, X-Frame-Options, etc.)

## Database

- PostgreSQL with UUIDs
- Foreign keys + unique constraints + check constraints
- GIN indexes for full-text search
- JSONB only for flexible data (browser_support, accessibility, performance)
- Relational tables for all core entities

## Migration Strategy

The existing Express.js backend continues to run. The Go backend is implemented incrementally:
1. Go API starts alongside Express (different port)
2. Endpoints migrated one at a time
3. Frontend `BACKEND_URL` switched once Go is production-ready
4. Express backend retired after full migration + verification
