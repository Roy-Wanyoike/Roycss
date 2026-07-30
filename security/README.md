# RoyCSS Security & Supply Chain

This directory holds the **automated security audit** for RoyCSS. Five
TypeScript scripts (run with `bun run`) generate JSON / text reports
under `security/results/`. The release pipeline
(`scripts/publish/release.ts`) calls all five before `npm publish`; any
non-zero exit blocks the release.

## Quick start

```bash
cd /home/z/my-project

# Run all 5 scripts (must all exit 0 before a release)
bun run security/audit.ts
bun run security/sbom.ts
bun run security/csp.ts
bun run security/css-exfiltration-check.ts
bun run security/xss-scan.ts
```

## Scripts

| Script | Purpose | Output | Exit code |
|---|---|---|---|
| `audit.ts` | Run `bun audit --json`, count vulnerabilities by severity, fail on any high/critical. | `results/audit-report.json` | 0 if 0 high+critical, 1 otherwise |
| `sbom.ts` | Generate a CycloneDX 1.4 SBOM from `package.json` and every dep's `package.json` (name, version, license). | `results/sbom.json` | 0 always (informational) |
| `csp.ts` | Emit the dev CSP (with `'unsafe-inline'` for Next.js HMR) and the production CSP (with per-request nonces + `'strict-dynamic'`). | `results/csp.txt`, `results/csp-production.txt` | 0 always |
| `css-exfiltration-check.ts` | Scan `dist/roycss.css`, `dist/effects.json`, and `src/lib/effects-batch-*.ts` for external `url()`, `@import`, `@font-face` with external `src`, and attribute-selector + `url()` exfiltration vectors. | `results/css-exfiltration-report.json` | 0 if 0 issues, 1 otherwise |
| `xss-scan.ts` | Scan `src/components/**/*.tsx` and `src/app/**/*.tsx` for `dangerouslySetInnerHTML` (without a `// SECURITY:` comment), `.innerHTML =`, `eval(`, `new Function(`, `document.write`. | `results/xss-report.json` | 0 if 0 unsanitized uses, 1 otherwise |

## Outputs

```
security/results/
├── audit-report.json              # bun audit summary (severity counts + advisories)
├── sbom.json                      # CycloneDX 1.4 SBOM
├── csp.txt                        # Dev CSP (with 'unsafe-inline' for Next.js HMR)
├── csp-production.txt             # Production CSP (with nonce placeholder + 'strict-dynamic')
├── css-exfiltration-report.json   # CSS exfil scan results
└── xss-report.json                # XSS scan results
```

All outputs are gitignored except `csp.txt` and `csp-production.txt`
(which are referenced by `next.config.ts` and `docs/`).

## Architecture

The five scripts are intentionally simple, dependency-free TypeScript
files. They use only `node:fs`, `node:path`, `node:child_process`, and
`node:crypto` — no runtime deps. They run with `bun run` (or `node` /
`tsx`) and exit with conventional Unix codes (0 = success, 1 = failure).

The scripts are **idempotent** — running them twice produces the same
output (modulo the audit timestamp). They are **side-effect-free** —
they write only to `security/results/`.

## Relationship to the docs

| Doc | Purpose |
|---|---|
| `docs/adr/07-security-supply-chain.md` | Decision: zero runtime deps for publishable packages, strict CSP, no `dangerouslySetInnerHTML` for user content |
| `docs/threat-models/07-security-supply-chain.md` | STRIDE + 6 CSS-specific attack vectors |
| `docs/benchmarks/07-security-supply-chain.md` | 36 KPIs with targets and measured values |
| `docs/plans/07-security-supply-chain.md` | 8-phase implementation plan |
| `docs/checklists/07-security-supply-chain.md` | 12-section review checklist (~60 binary checks) |

## CI integration

In CI, the release job runs:

```bash
bun run security/audit.ts && \
bun run security/sbom.ts && \
bun run security/csp.ts && \
bun run security/css-exfiltration-check.ts && \
bun run security/xss-scan.ts && \
bun run lint && \
scripts/publish/release.ts
```

If any step exits non-zero, the release is aborted. The SBOM
(`security/results/sbom.json`) and audit report
(`security/results/audit-report.json`) are uploaded as build artifacts
and attached to the GitHub release.

## Adding a new security check

1. Create `security/<check-name>.ts` following the same pattern:
   - `main()` reads input, scans, writes to `security/results/<check-name>-report.json`.
   - Returns 0 on success, 1 on failure.
   - Prints a human-readable summary to stdout.
2. Add a row to the table above.
3. Add a KPI to `docs/benchmarks/07-security-supply-chain.md` §1.
4. Add a checklist item to `docs/checklists/07-security-supply-chain.md`.
5. Add the script to the CI integration block above.

## License

MIT, same as the rest of RoyCSS.
