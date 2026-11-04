<div align="center">

# RoyCSS

### The AI native frontend engineering platform

Building the operating system for design to code execution, UI systems, and product velocity.

[![Live demo](https://img.shields.io/badge/live_demo-roycss.vercel.app-22c55e?style=flat-square&logo=vercel&logoColor=white)](https://roycss.vercel.app)
[![Effects](https://img.shields.io/badge/effects-1,983-10b981?style=flat-square)](#key-metrics)
[![Categories](https://img.shields.io/badge/categories-29-06b6d4?style=flat-square)](#key-metrics)
[![Products](https://img.shields.io/badge/platform_products-62-8b5cf6?style=flat-square)](#platform-overview)
[![Tests](https://img.shields.io/badge/tests-2%2C200%2B-22d3ee?style=flat-square)](#quality-and-governance)
[![TypeScript](https://img.shields.io/badge/tsc-strict_clean-3178c6?style=flat-square)](#quality-and-governance)
[![License](https://img.shields.io/badge/license-MIT-ec4899?style=flat-square)](LICENSE)

Live demo: <https://roycss.vercel.app>

</div>

---

## Why RoyCSS exists

Frontend teams are still forced to stitch together disconnected tools: component libraries, animation snippets, design tokens, AI copilots, and production quality gates. RoyCSS brings these into one system.

RoyCSS is a complete frontend engineering platform designed to help teams ship polished interfaces faster without sacrificing quality, accessibility, or maintainability.

At the center of the platform is a large, production oriented catalog of CSS effects and UI patterns, but the real value is broader:

- 1,983 production-ready effects across 29 categories
- 62 platform products spanning AI, studio tooling, inspection, cloud, academy, and marketplace workflows
- 70 developer tools for generation, analysis, conversion, and QA
- AI native workflows for design, implementation, mentoring, and review
- A design system built around tokens, themes, motion, and accessibility defaults
- Framework-agnostic output across CSS, inline styles, Tailwind, SCSS, CSS-in-JS, Vue, and HTML

---

## Platform overview

RoyCSS is positioned as a full stack frontend operating layer rather than a single library.

### Core pillars

- Design execution at scale: a broad catalog of reusable UI effects and patterns
- AI-assisted frontend work: RoyAI and LLM-backed modules for architecture, design, mentorship, review, and pairing
- Developer productivity: generators, visualizers, analyzers, and conversion tools
- Quality and governance: automated tests, type safety, accessibility checks, API drift checks, and secure deployment patterns
- Ecosystem expansion: marketplace, cloud services, platform products, and developer-facing tooling

### Product architecture

RoyCSS combines a live catalog, frontend tooling, backend APIs, AI modules, and platform products into a unified developer experience.

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express + Prisma + Zod, with Go-based production target architecture underway
- Runtime: Bun-first development flow with Node compatibility
- Deploy model: Vercel for the frontend and Railway for the backend API stack

---

## Key metrics

These are not marketing placeholders; the repo includes test assertions and CI gates that keep the numbers aligned with reality.

| Metric | Value | Source |
|---|---:|---|
| CSS effects | 1,983 | `src/lib/roycss-effects.ts` + effect-count tests |
| Effect categories | 29 | live homepage + category tests |
| Platform products | 62 | product registry |
| Backend modules | 75 | backend API modules |
| Backend API routes | 289 | documented in `API.md` |
| Developer tools | 70 | platform tool registry |
| Tests | 2,200+ | frontend + backend automated suites |
| Typecheck | 0 errors | strict TypeScript gate |

---

## Why this matters

### Problem
Modern frontend teams lose time in three ways:

1. Fragmented design and implementation tooling
2. Repetitive UI work across projects and platforms
3. Hard-to-scale quality and accessibility standards

### Solution
RoyCSS turns that work into a reusable system:

- UI patterns are searchable, previewable, and copyable
- Production-ready components are available in a rich effect catalog
- AI native assistance reduces friction during ideation and implementation
- Platform-level standards improve consistency, speed, and UX quality

This creates a compounding advantage: better UX, faster delivery, and more reusable frontend systems across product teams.

---

## Quality and governance

RoyCSS is designed for teams that need both speed and trust.

- 2,200+ automated tests across frontend and backend systems
- Strict TypeScript validation with zero type errors in the current gate
- WCAG AA oriented accessibility practices and automated axe audits
- API documentation with drift detection so docs and code stay aligned
- Secure response headers and static safe CSP setup for production deployments
- Fail fast backend validation using environment checks before runtime drift

This matters because product velocity is only durable when quality is enforced by default.

---

## Technical foundation

RoyCSS is built to be usable as a product, a library, and an ecosystem.

### Frontend
- Next.js 16 App Router
- React 19
- TypeScript 5 strict mode
- Tailwind CSS 4 and shadcn/ui patterns
- PWA ready architecture with service worker support

### Backend
- Express + Prisma + Zod
- Route level API organization with modular backend services
- SQLite in development, PostgreSQL ready production path
- Dual backend strategy with an incremental Go migration target

### Distribution
- npm package artifacts for consumer usage
- CLI and MCP tooling for automation and AI assistant workflows
- VS Code extension support for in-editor development

---

## Roadmap

The roadmap is organized around compounding platform value:

- Expand the frontend design and UI intelligence layer
- Improve AI powered generation, review, and workflow automation
- Extend platform products beyond the catalog into broader product operations
- Mature the backend and production infrastructure for scale
- Continue quality, security, and accessibility investments as the platform grows

---

## Getting started

### Install the package

```bash
npm install roycss
```

### Run the project locally

```bash
git clone https://github.com/Roy-Wanyoike/Roycss.git
cd Roycss
bun install
bun run dev
```

The frontend can run standalone because the full catalog ships in-repo. For the backend API and full platform stack, follow the repo setup in the development instructions and backend configuration guide.

---

## Project status

RoyCSS is actively evolving as a productized frontend platform with a live demo, a strong engineering foundation, and a growing ecosystem of developer tooling.

The public facing platform and repo reflect a deliberate build toward a broader design to code operating system for modern product teams.

---

## Contribute

We welcome issue reports, bug fixes, UI improvements, and feature proposals.

### Raise an issue

Before opening a new issue, check whether a similar report already exists. Include:

- problem summary
- steps to reproduce
- expected vs actual behavior
- browser, OS, and device details
- screenshots or a minimal reproduction if possible

Open an issue here: [GitHub issues](https://github.com/Roy-Wanyoike/Roycss/issues)

### Contribute code

1. Fork the repo and create a feature branch.
2. Follow the local setup in the project docs.
3. Keep changes focused and validate with the relevant checks.
4. Open a pull request with a clear explanation of the change and its impact.

See the full contribution guide: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

## License

MIT. See [`LICENSE`](LICENSE).

## Contact

Built by [Royford Wanyoike Wamaitha](https://github.com/Roy-Wanyoike).

- GitHub: [@Roy-Wanyoike](https://github.com/Roy-Wanyoike)
- Email: [roywanyoike328@gmail.com](mailto:roywanyoike328@gmail.com)
- Issues: [Open an issue](https://github.com/Roy-Wanyoike/Roycss/issues)
