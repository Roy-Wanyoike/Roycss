# RoyCSS — Database Report

> **Audit ID**: AUDIT-1
> **Date**: 2026-08-29
> **Source of truth**: `backend/prisma/schema.prisma` (487 lines)
> **Provider**: SQLite (dev) → Postgres (Supabase prod)
> **Total models**: 45
> **Generator**: `prisma-client-js`
> **Migration tool**: `prisma migrate dev` (dev) / `prisma migrate deploy` (prod); `prisma db push` for prototyping

---

## 1. Prisma conventions used throughout

| Convention | Example | Rationale |
|---|---|---|
| Primary key | `id String @id @default(cuid())` | CUIDs are sortable + collision-resistant across machines |
| Timestamps | `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt` | Every domain model has audit timestamps |
| JSON columns | `<name>Json String` (e.g. `lessonsJson`, `metricsJson`) | SQLite doesn't support native JSON; Postgres will swap to `Json` type |
| Foreign keys | `userId String` + `user User @relation(fields: [userId], references: [id], onDelete: Cascade)` | Cascade delete for owned relations |
| Single-col unique | `email String @unique` | Enforce uniqueness at the DB level |
| Composite unique | `@@unique([userId, effectId])` | Composite constraints |
| Single-col index | `@@index([userId])` | Speed up FK joins |
| Composite index | `@@index([userId, challengeId])` | Speed up common query patterns |

### `generator` + `datasource` blocks

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Production swap: change `provider` to `"postgresql"` and `DATABASE_URL` to a Supabase/Neon/Railway Postgres URL.

---

## 2. Models by domain

### 2.1 Identity & Auth (4 models)

#### `User`
> The registered user. Backs the real `auth` module (`/api/v1/auth/*`).

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `email` | `String` | `@unique` |
| `passwordHash` | `String` | bcrypt-hashed (cost factor 10) |
| `name` | `String?` | Optional display name |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `favorites` | `EffectFavorite[]` | Relation — cascade delete |
| `collections` | `Collection[]` | Relation — cascade delete |

- **Indexes**: `@@index([email])`
- **Unique**: `@unique` on `email`

#### `EffectFavorite`
> Per-user effect favorite. (Currently stored client-side in `localStorage`; backend model ready to be wired.)

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String` | FK → `User.id` (cascade delete) |
| `effectId` | `String` | The RoyCSS effect id (e.g. `pulse-glow`) |
| `user` | `User` | Relation |
| `createdAt` | `DateTime` | `@default(now())` |

- **Unique**: `@@unique([userId, effectId])` — a user can favorite an effect at most once
- **Indexes**: `@@index([userId])`, `@@index([effectId])` — speed up per-user lookups + per-effect popularity

#### `Collection`
> Per-user named collection of effects.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String` | FK → `User.id` (cascade delete) |
| `name` | `String` | Display name |
| `description` | `String?` | Optional |
| `effectIds` | `String` | Comma-separated list of effect ids (or JSON array as string) |
| `user` | `User` | Relation |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([userId])`

#### `ContactMessage`
> Persisted contact form submissions. Backs the real `contact` module (`POST /api/v1/contact`).

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | Submitter's name |
| `email` | `String` | Submitter's email (Zod-validated) |
| `subject` | `String` | Subject line |
| `message` | `String` | Body (Zod min length: 10) |
| `read` | `Boolean` | `@default(false)` — admin "mark as read" flag |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([email])` (lookup by submitter), `@@index([createdAt])` (sorted admin inbox view)

---

### 2.2 Learning & Challenges (6 models)

#### `LearningPath`
> RoyCSS Academy learning paths. Backs the `academy` module (currently mock).

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `title` | `String` | Display title |
| `description` | `String` | Short description |
| `level` | `String` | `beginner` / `intermediate` / `advanced` |
| `lessonsJson` | `String` | JSON array of lesson objects (id, title, content, duration) |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`

#### `PathProgress`
> Per-user progress through a learning path.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional (allows anonymous progress) |
| `pathId` | `String` | FK to `LearningPath.id` (relation not enforced — soft FK) |
| `completedLessonsJson` | `String` | JSON array of completed lesson ids |
| `lastLessonId` | `String?` | Resume pointer |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@@unique([userId, pathId])` — one progress record per user per path
- **Indexes**: `@@index([userId])`, `@@index([pathId])`

#### `Challenge`
> Daily CSS challenge. Backs the `challenges` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `title` | `String` | Display title |
| `description` | `String` | Problem statement |
| `difficulty` | `String` | `easy` / `medium` / `hard` |
| `prompt` | `String` | Full prompt text |
| `starterCode` | `String` | Initial code for the user |
| `solutionCode` | `String` | Reference solution (hidden from user) |
| `tagsJson` | `String` | JSON array of tag strings |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`

#### `ChallengeSubmission`
> A user's submission for a challenge.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional (allows anonymous submissions) |
| `challengeId` | `String` | FK to `Challenge.id` (soft) |
| `code` | `String` | Submitted code |
| `passed` | `Boolean` | `@default(false)` — test result |
| `score` | `Int` | `@default(0)` — 0 to 100 |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([userId, challengeId])`, `@@index([challengeId])`

#### `Certification`
> RoyCSS certification (Foundation, Practitioner, Architect). Backs the `certifications` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `name` | `String` | Display name |
| `description` | `String` | What the cert covers |
| `requirementsJson` | `String` | JSON array of requirement objects |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`

#### `CertificationAttempt`
> A user's attempt at a certification exam.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional |
| `certificationId` | `String` | FK to `Certification.id` (soft) |
| `score` | `Int` | `@default(0)` |
| `passed` | `Boolean` | `@default(false)` |
| `completedAt` | `DateTime?` | When the attempt was finished (null = in progress) |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([userId, certificationId])`, `@@index([certificationId])`

---

### 2.3 Audit & Compliance (4 models)

#### `AuditProject`
> A monitored project (URL). Backs the `audit-center` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Owner |
| `name` | `String` | Display name |
| `description` | `String` | What the project is |
| `url` | `String` | The URL to audit |
| `status` | `String` | `@default("active")` |
| `lastAuditAt` | `DateTime?` | When the last audit ran |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([userId])`

#### `AuditResult`
> A single audit run for a project.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `projectId` | `String` | FK to `AuditProject.id` (soft) |
| `summaryJson` | `String` | JSON summary (scores, counts) |
| `violationsJson` | `String` | JSON array of violation objects (rule, severity, element) |
| `score` | `Int` | `@default(0)` — 0 to 100 |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([projectId])`

#### `ComplianceStandard`
> Compliance framework (WCAG 2.2 AA, GDPR, SOC2). Backs the `compliance` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `name` | `String` | Display name |
| `description` | `String` | What the standard covers |
| `framework` | `String` | `wcag` / `gdpr` / `soc2` / etc. |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`

#### `ComplianceScan`
> A compliance scan run against a URL.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `standardId` | `String` | FK to `ComplianceStandard.id` (soft) |
| `url` | `String` | Scanned URL |
| `status` | `String` | `@default("pending")` — `pending` / `running` / `complete` / `failed` |
| `violationsJson` | `String` | JSON array of violations |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([standardId])`

---

### 2.4 Cloud & Deploy (4 models)

#### `CloudProject`
> A cloud project (provider + region + config). Backs the `cloud` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Owner |
| `name` | `String` | Display name |
| `provider` | `String` | `aws` / `gcp` / `azure` / `cloudflare` / `vercel` |
| `region` | `String` | e.g. `us-east-1` |
| `status` | `String` | `@default("active")` |
| `configJson` | `String` | JSON config blob |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([userId])`

#### `Deployment`
> A deployment record. Backs both the `cloud` and `deploy` modules.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `projectId` | `String?` | Optional FK to `CloudProject.id` (soft) |
| `environment` | `String` | `dev` / `staging` / `prod` |
| `status` | `String` | `@default("pending")` — `pending` / `building` / `deployed` / `failed` |
| `url` | `String?` | Deployed URL |
| `logsUrl` | `String?` | Link to build logs |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([projectId])`

#### `FleetProject`
> A multi-site fleet project. Backs the `fleet` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Owner |
| `name` | `String` | Display name |
| `description` | `String` | What the fleet covers |
| `serviceCount` | `Int` | `@default(0)` — number of services in the fleet |
| `status` | `String` | `@default("active")` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([userId])`

#### `PreviewBranch`
> A preview branch deployment. Backs the `preview` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `projectId` | `String?` | Optional FK to `CloudProject.id` (soft) |
| `branchName` | `String` | Git branch name |
| `previewUrl` | `String` | Unique preview URL |
| `status` | `String` | `@default("active")` — `building` / `active` / `torn-down` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([projectId])`

---

### 2.5 Studio & Workspace (2 models)

#### `StudioProject`
> Visual builder project. Backs the `studio` module. The `filesJson` field stores the project's full file tree as a JSON string.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Owner |
| `name` | `String` | Display name |
| `description` | `String` | What the project is |
| `filesJson` | `String` | JSON array of `{ path, content, type }` objects |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([userId])`

#### `WorkspaceResource`
> A resource within a team workspace. Backs the `workspace` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Owner |
| `type` | `String` | `effect` / `pattern` / `recipe` / `block` / `blueprint` / `theme` |
| `name` | `String` | Resource name |
| `contentJson` | `String` | JSON resource content |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([userId, type])`

---

### 2.6 Enterprise & Governance (6 models)

#### `Organization`
> An organization (top of the enterprise hierarchy).

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `name` | `String` | Display name |
| `plan` | `String` | `@default("free")` — `free` / `pro` / `enterprise` |
| `seats` | `Int` | `@default(1)` — number of user seats |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`

#### `Team`
> A team within an organization.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `orgId` | `String` | FK to `Organization.id` (soft) |
| `name` | `String` | Display name |
| `slug` | `String` | URL-safe slug |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@@unique([orgId, slug])` — slugs unique within an org
- **Indexes**: `@@index([orgId])`

#### `License`
> A license key for an organization.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `orgId` | `String` | FK to `Organization.id` (soft) |
| `key` | `String` | `@unique` — the license key string |
| `tier` | `String` | `@default("free")` |
| `expiresAt` | `DateTime?` | Optional expiry |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `key`
- **Indexes**: `@@index([orgId])`

#### `EnterpriseAuditLog`
> Audit log for enterprise actions.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `orgId` | `String` | FK to `Organization.id` (soft) |
| `userId` | `String?` | The acting user |
| `action` | `String` | What was done (e.g. `license.create`, `team.member.invite`) |
| `resourceType` | `String` | `team` / `license` / `policy` / etc. |
| `resourceId` | `String?` | The affected resource id |
| `metadataJson` | `String` | JSON metadata (before/after, IP, user agent) |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([orgId, createdAt])` — sorted audit log per org

#### `GovernancePolicy`
> A governance policy (design-token policy, etc.). Backs the `governance` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `orgId` | `String?` | Optional org scope |
| `name` | `String` | Display name |
| `rulesJson` | `String` | JSON array of rule objects |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([orgId])`

#### `GovernanceApproval`
> An approval record for a governance policy decision.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `policyId` | `String` | FK to `GovernancePolicy.id` (soft) |
| `userId` | `String?` | The approver |
| `resourceType` | `String` | What's being approved |
| `resourceId` | `String` | The resource id |
| `decision` | `String` | `approved` / `rejected` / `pending` |
| `reason` | `String?` | Optional reason |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([policyId, userId])`

---

### 2.7 Marketplace & Templates (3 models)

#### `Template`
> A community-published template. Backs the `marketplace` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `name` | `String` | Display name |
| `description` | `String` | Short description |
| `authorId` | `String?` | Optional FK to `User.id` (soft) |
| `category` | `String` | e.g. `landing` / `dashboard` / `pricing` |
| `htmlCode` | `String` | Full HTML |
| `cssCode` | `String?` | Optional CSS |
| `jsCode` | `String?` | Optional JS |
| `downloads` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`
- **Indexes**: `@@index([category])`

#### `TemplateReview`
> A user review for a template.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `templateId` | `String` | FK to `Template.id` (soft) |
| `userId` | `String?` | The reviewer |
| `rating` | `Int` | 1 to 5 |
| `comment` | `String?` | Optional review text |
| `createdAt` | `DateTime` | `@default(now())` |

- **Unique**: `@@unique([templateId, userId])` — one review per user per template
- **Indexes**: `@@index([templateId])`

#### `Blueprint`
> A page-level blueprint. Backs the `blueprints` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `title` | `String` | Display title |
| `description` | `String` | Short description |
| `category` | `String` | e.g. `pricing` / `contact` / `dashboard` / `blog` |
| `nodesJson` | `String` | JSON architecture graph nodes |
| `edgesJson` | `String` | JSON architecture graph edges |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`
- **Indexes**: `@@index([category])`

---

### 2.8 Blocks (1 model)

#### `Block`
> An application block (Auth, Billing, CRM, etc.). Backs the `blocks` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `name` | `String` | Display name |
| `description` | `String` | Short description |
| `category` | `String` | e.g. `auth` / `billing` / `crm` / `analytics` |
| `htmlCode` | `String` | Full HTML |
| `cssCode` | `String?` | Optional CSS |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`
- **Indexes**: `@@index([category])`

---

### 2.9 Spotlight (1 model)

#### `SpotlightItem`
> A featured community showcase item. Backs the `spotlight` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | Display title |
| `description` | `String` | Short description |
| `imageUrl` | `String` | Screenshot/thumbnail URL |
| `link` | `String` | External link to the showcase |
| `type` | `String` | `website` / `app` / `component` / `tutorial` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([type])`

---

### 2.10 Observatory (1 model)

#### `ObservatorySite`
> A monitored production site. Backs the `observatory` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `url` | `String` | `@unique` |
| `name` | `String` | Display name |
| `lighthouseScore` | `Int?` | Latest Lighthouse score (0–100) |
| `lastChecked` | `DateTime?` | When last audited |
| `metricsJson` | `String?` | JSON metrics blob (CSS payload size, unused rules %, override rate) |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `url`

---

### 2.11 Live (2 models)

#### `LiveSession`
> A live collaboration session. Backs the `live` module (currently in-memory via socket.io on port 3003).

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `name` | `String` | Display name |
| `ownerId` | `String?` | Optional owner FK to `User.id` (soft) |
| `roomId` | `String` | `@unique` — the Socket.io room id |
| `isPublic` | `Boolean` | `@default(true)` |
| `maxUsers` | `Int` | `@default(50)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`, `@unique` on `roomId`

#### `LiveMessage`
> A message in a live session.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `sessionId` | `String` | FK to `LiveSession.id` (soft) |
| `userId` | `String?` | Optional sender FK to `User.id` (soft) |
| `content` | `String` | Message text |
| `type` | `String` | `@default("message")` — `message` / `system` / `cursor` |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([sessionId, createdAt])` — sorted message history per session

---

### 2.12 Open Source (4 models)

#### `GoodFirstIssue`
> A good-first-issue for new contributors. Backs the `open` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | Issue title |
| `description` | `String` | Body |
| `repo` | `String` | Repo path (e.g. `roycss/roycss`) |
| `url` | `String` | External GitHub URL |
| `difficulty` | `String` | `easy` / `medium` / `hard` |
| `tagsJson` | `String` | JSON array of tag strings |
| `status` | `String` | `@default("open")` — `open` / `in-progress` / `closed` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([status])`

#### `RFC`
> A Request for Comments document.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | RFC title |
| `description` | `String` | Short summary |
| `status` | `String` | `@default("draft")` — `draft` / `review` / `accepted` / `rejected` |
| `content` | `String` | Full RFC body (Markdown) |
| `authorId` | `String?` | Optional author FK to `User.id` (soft) |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([status])`

#### `Roadmap`
> A roadmap entry (per quarter).

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | Display title |
| `description` | `String` | Short description |
| `status` | `String` | `@default("planned")` — `planned` / `in-progress` / `shipped` / `deferred` |
| `quarter` | `String` | e.g. `2026-Q1` |
| `itemsJson` | `String` | JSON array of roadmap item objects |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([status])`

#### `Contributor`
> A GitHub contributor. Synced from the GitHub API.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `githubLogin` | `String` | `@unique` |
| `name` | `String?` | Optional display name |
| `avatarUrl` | `String?` | Avatar URL |
| `commitsCount` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `githubLogin`

---

### 2.13 DevTools / Perf (3 models)

#### `BenchmarkResult`
> A benchmark run result. Backs the `benchmark` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional owner |
| `name` | `String` | Benchmark name |
| `metricsJson` | `String` | JSON metrics blob (per-browser, per-device) |
| `duration` | `Float` | Duration in seconds |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([userId])`

#### `BundleResult`
> A bundle analysis result. Backs the `bundle` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional owner |
| `name` | `String` | Bundle name |
| `sizeBytes` | `Int` | Total size |
| `gzipBytes` | `Int` | Gzip size |
| `modulesJson` | `String` | JSON array of `{ path, sizeBytes, gzipBytes }` |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([userId])`

#### `ProfilerResult`
> A profiler run result. Backs the `profiler` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional owner |
| `url` | `String` | Profiled URL |
| `metricsJson` | `String` | JSON metrics blob (layout, paint, composite times per rule) |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([userId])`

---

### 2.14 Digital Twin (1 model)

#### `TwinResult`
> A digital-twin simulation result. Backs the `digital-twin` module. Needs Lighthouse.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional owner |
| `url` | `String` | Simulated URL |
| `lighthouseJson` | `String` | JSON Lighthouse report |
| `webVitalsJson` | `String` | JSON Web Vitals (LCP, FID, CLS, INP) |
| `createdAt` | `DateTime` | `@default(now())` |

- **Indexes**: `@@index([userId])`

---

### 2.15 Theme & OS (2 models)

#### `Theme`
> A user theme preset. Backs the `themes` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `slug` | `String` | `@unique` |
| `name` | `String` | Display name |
| `description` | `String` | Short description |
| `tokensJson` | `String` | JSON token set (colors, fonts, spacing, etc.) |
| `isPublic` | `Boolean` | `@default(false)` |
| `userId` | `String?` | Optional owner |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@unique` on `slug`
- **Indexes**: `@@index([userId])`

#### `OSDashboard`
> A user's Roy OS dashboard layout. Backs the `os` module.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String?` | Optional owner |
| `layoutJson` | `String` | JSON layout blob (tile positions, sizes) |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Unique**: `@@unique([userId])` — one dashboard per user

---

### 2.16 Search (1 model)

#### `SearchIndex`
> A search index entry. Backs the `search` module. Needs Postgres FTS in production.

| Field | Type | Attributes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `type` | `String` | `effect` / `recipe` / `pattern` / `block` / `blueprint` / `theme` / `doc` |
| `title` | `String` | Display title |
| `description` | `String` | Short description |
| `url` | `String?` | Deep-link URL |
| `tagsJson` | `String` | JSON array of tags |
| `content` | `String` | Full searchable text (Markdown or plain) |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

- **Indexes**: `@@index([type])`
- **Postgres migration note**: add `@@index([content])` with `pg_trgm` extension or use a `tsvector` column for full-text search.

---

## 3. Cross-model summary

### Foreign-key relations (with cascade)

| From | To | On delete |
|---|---|---|
| `EffectFavorite.userId` | `User.id` | Cascade |
| `Collection.userId` | `User.id` | Cascade |

All other relations are **soft** (no Prisma `@relation` declared — just convention-based). This is intentional to keep migrations flexible during the prototyping phase. Production should add explicit relations + cascade rules.

### Single-column unique constraints (10)

| Model | Field |
|---|---|
| `User` | `email` |
| `LearningPath` | `slug` |
| `Challenge` | `slug` |
| `Certification` | `slug` |
| `ComplianceStandard` | `slug` |
| `Organization` | `slug` |
| `License` | `key` |
| `Template` | `slug` |
| `Block` | `slug` |
| `Blueprint` | `slug` |
| `ObservatorySite` | `url` |
| `LiveSession` | `slug` |
| `LiveSession` | `roomId` |
| `Contributor` | `githubLogin` |
| `Theme` | `slug` |

### Composite unique constraints (4)

| Model | Fields |
|---|---|
| `EffectFavorite` | `[userId, effectId]` |
| `PathProgress` | `[userId, pathId]` |
| `Team` | `[orgId, slug]` |
| `TemplateReview` | `[templateId, userId]` |
| `OSDashboard` | `[userId]` |

### Indexes (summary)

Most FK fields have a single-column `@@index`; common query patterns have composite indexes (e.g. `@@index([userId, challengeId])`, `@@index([orgId, createdAt])`, `@@index([sessionId, createdAt])`). Total: ~40 index declarations across the 45 models.

---

## 4. SQLite → Postgres migration notes

When the production `DATABASE_URL` is changed to a Supabase/Neon/Railway Postgres URL:

1. Update `datasource db` in `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. (Optional) Promote `String` JSON columns to native `Json`:
   ```prisma
   lessonsJson Json    // was String
   ```
   This is a non-breaking change — the existing JSON-string values will be re-typed as `Json` on read.

3. Run `prisma migrate deploy` to apply the schema to Postgres.

4. (Optional) For `SearchIndex.content`, add a `tsvector` column + GIN index for full-text search:
   ```sql
   ALTER TABLE "SearchIndex" ADD COLUMN "content_tsv" tsvector
     GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
   CREATE INDEX "SearchIndex_content_tsv_idx" ON "SearchIndex" USING GIN ("content_tsv");
   ```

5. Swap the `express-rate-limit` in-memory store and the `LRUCache` for Redis-backed stores.

6. Swap the Socket.io in-memory adapter for the Redis adapter (`@socket.io/redis-adapter`).

---

## 5. Where each model is used (module ↔ model map)

| Model | Backend module(s) using it | Status |
|---|---|---|
| `User` | `auth` | ✅ Real |
| `EffectFavorite` | (frontend `useFavorites` — currently localStorage; backend wiring pending) | Pending |
| `Collection` | (frontend `CustomCollections` — currently localStorage; backend wiring pending) | Pending |
| `ContactMessage` | `contact` | ✅ Real |
| `LearningPath` | `academy` | Mock (model ready) |
| `PathProgress` | `academy` | Mock (model ready) |
| `Challenge` | `challenges` | Mock (model ready) |
| `ChallengeSubmission` | `challenges` | Mock (model ready) |
| `Certification` | `certifications` | Mock (model ready) |
| `CertificationAttempt` | `certifications` | Mock (model ready) |
| `AuditProject` | `audit-center` | Mock (model ready) |
| `AuditResult` | `audit-center` | Mock (model ready) |
| `CloudProject` | `cloud` | Mock (model ready) |
| `Deployment` | `cloud`, `deploy` | Mock (model ready) |
| `FleetProject` | `fleet` | Mock (model ready) |
| `StudioProject` | `studio` | Mock (model ready) |
| `PreviewBranch` | `preview` | Mock (model ready) |
| `WorkspaceResource` | `workspace` | Mock (model ready) |
| `Organization` | `enterprise` | Mock (model ready) |
| `Team` | `enterprise` | Mock (model ready) |
| `License` | `enterprise` | Mock (model ready) |
| `EnterpriseAuditLog` | `enterprise` | Mock (model ready) |
| `GovernancePolicy` | `governance` | Mock (model ready) |
| `GovernanceApproval` | `governance` | Mock (model ready) |
| `Template` | `marketplace` | Mock (model ready) |
| `TemplateReview` | `marketplace` | Mock (model ready) |
| `Blueprint` | `blueprints` | Mock (model ready) |
| `Block` | `blocks` | Mock (model ready) |
| `SpotlightItem` | `spotlight` | Mock (model ready) |
| `ObservatorySite` | `observatory` | Mock (model ready) |
| `LiveSession` | `live` (in-memory via socket.io) | Mock (model ready) |
| `LiveMessage` | `live` (in-memory via socket.io) | Mock (model ready) |
| `GoodFirstIssue` | `open` | Mock (model ready) |
| `RFC` | `open` | Mock (model ready) |
| `Roadmap` | `open` | Mock (model ready) |
| `Contributor` | `open` | Mock (model ready) |
| `BenchmarkResult` | `benchmark` | Mock (model ready) |
| `BundleResult` | `bundle` | Mock (model ready) |
| `ProfilerResult` | `profiler` | Mock (model ready) |
| `TwinResult` | `digital-twin` | Mock (model ready) |
| `Theme` | `themes` | Mock (model ready) |
| `OSDashboard` | `os` | Mock (model ready) |
| `ComplianceStandard` | `compliance` | Mock (model ready) |
| `ComplianceScan` | `compliance` | Mock (model ready) |
| `SearchIndex` | `search` | Mock (model ready) |

---

## 6. Model count summary

| Domain | Models | Count |
|---|---|---|
| Identity & Auth | User, EffectFavorite, Collection, ContactMessage | 4 |
| Learning & Challenges | LearningPath, PathProgress, Challenge, ChallengeSubmission, Certification, CertificationAttempt | 6 |
| Audit & Compliance | AuditProject, AuditResult, ComplianceStandard, ComplianceScan | 4 |
| Cloud & Deploy | CloudProject, Deployment, FleetProject, PreviewBranch | 4 |
| Studio & Workspace | StudioProject, WorkspaceResource | 2 |
| Enterprise & Governance | Organization, Team, License, EnterpriseAuditLog, GovernancePolicy, GovernanceApproval | 6 |
| Marketplace & Templates | Template, TemplateReview, Blueprint | 3 |
| Blocks | Block | 1 |
| Spotlight | SpotlightItem | 1 |
| Observatory | ObservatorySite | 1 |
| Live | LiveSession, LiveMessage | 2 |
| Open Source | GoodFirstIssue, RFC, Roadmap, Contributor | 4 |
| DevTools / Perf | BenchmarkResult, BundleResult, ProfilerResult | 3 |
| Digital Twin | TwinResult | 1 |
| Theme & OS | Theme, OSDashboard | 2 |
| Search | SearchIndex | 1 |
| **Total** | | **45** |
