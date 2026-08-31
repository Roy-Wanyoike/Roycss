# RoyCSS Test Report

> Companion to `ROYCSS_BACKEND_ARCHITECTURE.md`. Test plan + current
> verification status.

---

## 1. Test layers

| Layer | Scope | Status |
|---|---|---|
| Unit | `service.ts` / Go `service.go` logic in isolation | TODO A8 |
| Integration | `routes.ts` / Go handler + real SQLite/PG via supertest | TODO A8 |
| Contract | pinned `/api/v1` response shapes (TS + Go share them) | TODO A8 |
| Security | authn, authz, injection, rate-limit, secret exposure | TODO B12 |
| Performance | p50/p95/p99 on hot endpoints (needs Go+PG+Redis host) | TODO B12 |
| E2E | live Next.js frontend driving the backend through the browser | ✅ verified this session |

---

## 2. E2E verification performed this session

Using Agent Browser + VLM against the live sandbox:

| Check | Expected | Actual | Pass |
|---|---|---|---|
| Next.js dev server | port 3000 listening | `:::3000 LISTEN` (pid 4857) | ✅ |
| Express backend | port 4000 listening, healthy | `:::4000 LISTEN`, `/api/v1/health` → `status:ok, database:connected` | ✅ |
| Effects loaded | 1,749 effects at boot | `count:1749, categories:29, tags:1772` | ✅ |
| Search index | populated | `SearchIndex populated, inserted:1749` | ✅ |
| `/` page title | `RoyCSS — AI-Native Frontend Engineering Platform` | exact match | ✅ |
| `/` page body | non-trivial render | 769,485 chars | ✅ |
| `/` page headings | ≥ 10 `<h2>` | 12 | ✅ |
| Live badges | product cards wired to backend | 34 "Live", 0 "Demo"/"Sync" | ✅ |
| Screenshot | full page, not blank | 775 KB PNG | ✅ |
| VLM visual review | described as fully rendered modern developer platform | confirmed header, hero, feature cards, categorized effect lists, pricing, FAQ, footer | ✅ |
| No regression | no existing route/effect/component removed | none removed (additive only) | ✅ |

### Commands used
```bash
agent-browser open http://localhost:3000/
agent-browser eval "document.title"
agent-browser eval "document.body.innerHTML.length"
agent-browser eval "document.querySelectorAll('h2').length"
agent-browser eval "Array.from(document.querySelectorAll('span')).filter(s=>s.textContent==='Live').length"
agent-browser screenshot /home/z/my-project/roycss-3000.png --full
z-ai vision -p "Describe this screenshot…" -i /home/z/my-project/roycss-3000.png
```

---

## 3. Critical flows to cover (target test plan)

### Identity
- [ ] signup → login → refresh → me → logout
- [ ] invalid credentials → 401
- [ ] expired access token → refresh → new access token
- [ ] API key create → use → rotate → revoke

### Authorization
- [ ] org member can read org's projects; non-member cannot (403)
- [ ] role escalation blocked (MEMBER cannot DELETE org)
- [ ] private project invisible to non-members

### Content / registry
- [ ] list effects with cursor pagination
- [ ] get effect by slug (cached vs uncached)
- [ ] publish a registry package (NPM_TOKEN path + local fallback)
- [ ] registry version history

### Projects / playground / studio
- [ ] create project (public / private / unlisted)
- [ ] save playground → fork → share → restore
- [ ] studio project save + version restore

### Marketplace
- [ ] creator lists a product
- [ ] purchase is idempotent (double-submit → one charge)
- [ ] review create + display
- [ ] untrusted package upload is validated (no in-process execution)

### Billing
- [ ] subscribe → invoice → cancel
- [ ] refund is idempotent
- [ ] entitlement enforced after cancellation

### AI / MCP / CLI
- [ ] AI session → message → usage debited
- [ ] MCP tool invoke with scoped API key
- [ ] `roy search` returns registry results

### Search / notifications / audit
- [ ] search across effects/components/patterns/marketplace/docs
- [ ] notification create + mark-read
- [ ] audit entry written on every mutating endpoint

### Workers
- [ ] enqueue accessibility audit → poll job → result
- [ ] enqueue AI generation → poll job → result
- [ ] worker survives API restart (job persisted in Redis)

---

## 4. Performance test plan (needs Go + PG + Redis host)

- 100 concurrent users, 5 min soak — record p50/p95/p99
- 1,000 concurrent users, 5 min soak — record p50/p95/p99 + error rate
- 10,000 concurrent requests, burst — record peak latency + error rate
- Hot endpoints: `/health/live`, `GET /effects`, `GET /effects/:slug`,
  `GET /search?q=`, `POST /auth/login`

Report p50/p95/p99, error rate, memory, CPU, DB latency, Redis latency,
queue depth. No unverified scalability claims.

---

## 5. Current gaps

- [ ] Unit + integration tests for all 68 TS modules (TODO A8).
- [ ] Contract test harness pinning `/api/v1` shapes (TODO A8).
- [ ] Security test suite (TODO B12).
- [ ] Performance test suite (TODO B12, needs Go host).
- [ ] E2E suite automated in CI (currently manual via Agent Browser).
