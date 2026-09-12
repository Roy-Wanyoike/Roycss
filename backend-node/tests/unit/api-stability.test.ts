/**
 * Unit tests — API stability gate internals (PF-013 acceptance #2).
 *
 *   1. parseMajorVersion — semver major extraction (prerelease ok,
 *      non-semver / two-segment rejected)
 *   2. diffSurfaces — removed / weakened / hardened / added
 *      classification over fixture route tables (incl. a backend route
 *      re-appearing as an unauthenticated frontend handler)
 *   3. evaluateGate — the version-aware verdict (the escape hatch):
 *        removal or auth weakening WITHOUT a major bump  → fail
 *        removal WITH a major bump                        → major-bump-allowed
 *        additions (with or without version change)       → pass
 *        unparseable / regressed version strings          → invalid-versions
 *   4. renderSnapshot — deterministic output (sorted keys, round-trip)
 *   5. collectRoutes + readSnapshot — walker sanity against the real
 *      route tree + the committed snapshot file
 *
 * The full CLI gate (exit 1 on violations) is exercised end-to-end by
 * .github/workflows/api-gate.yml; these tests pin the decision logic.
 */
import { describe, expect, it } from "vitest";

import {
  collectRoutes,
  diffSurfaces,
  evaluateGate,
  parseMajorVersion,
  readSnapshot,
  renderSnapshot,
  type RouteEntry,
} from "../../scripts/check-api-stability.js";

/** Fixture snapshot table — a slice of the real surface shape. */
const SNAPSHOT: Record<string, RouteEntry> = {
  "GET /api/v1/effects": { origin: "backend", auth: "none" },
  "POST /api/v1/collections": { origin: "backend", auth: "required" },
  "GET /api/v1/favorites": { origin: "backend", auth: "optional" },
  "GET /api/health": { origin: "frontend" },
};

const backend = (auth: RouteEntry["auth"]): RouteEntry => ({
  origin: "backend",
  auth,
});

describe("parseMajorVersion (PF-013)", () => {
  it("1. extracts the major from semver strings", () => {
    expect(parseMajorVersion("1.0.0")).toBe(1);
    expect(parseMajorVersion("10.42.7")).toBe(10);
    expect(parseMajorVersion("2.0.0-rc.1")).toBe(2);
    expect(parseMajorVersion("v3.1.0")).toBe(3);
  });

  it("2. rejects non-semver strings with null", () => {
    expect(parseMajorVersion("dev")).toBeNull();
    expect(parseMajorVersion("1.2")).toBeNull();
    expect(parseMajorVersion("")).toBeNull();
  });
});

describe("diffSurfaces (PF-013)", () => {
  it("3. flags a snapshot route missing from the current table as removed", () => {
    const current = { ...SNAPSHOT };
    delete current["GET /api/v1/effects"];
    const report = diffSurfaces(SNAPSHOT, current);
    expect(report.violations).toEqual([
      {
        key: "GET /api/v1/effects",
        kind: "removed",
        detail: "present in api-surface.json, gone from the code (backend)",
      },
    ]);
    expect(report.additions).toEqual([]);
  });

  it("4. flags a weakened auth requirement (required → optional → none)", () => {
    // required → optional
    expect(
      diffSurfaces(SNAPSHOT, {
        ...SNAPSHOT,
        "POST /api/v1/collections": backend("optional"),
      }).violations,
    ).toMatchObject([{ key: "POST /api/v1/collections", kind: "weakened" }]);
    // required → none
    expect(
      diffSurfaces(SNAPSHOT, {
        ...SNAPSHOT,
        "POST /api/v1/collections": backend("none"),
      }).violations,
    ).toMatchObject([{ key: "POST /api/v1/collections", kind: "weakened" }]);
    // optional → none
    expect(
      diffSurfaces(SNAPSHOT, {
        ...SNAPSHOT,
        "GET /api/v1/favorites": backend("none"),
      }).violations,
    ).toMatchObject([{ key: "GET /api/v1/favorites", kind: "weakened" }]);
  });

  it("5. flags a backend route whose auth vanished with the route itself (backend → frontend handler)", () => {
    const report = diffSurfaces(SNAPSHOT, {
      ...SNAPSHOT,
      "POST /api/v1/collections": { origin: "frontend" },
    });
    expect(report.violations).toEqual([
      {
        key: "POST /api/v1/collections",
        kind: "weakened",
        detail:
          "auth requirement dropped: required → none " +
          "(no longer a backend route — frontend handler has no static auth)",
      },
    ]);
  });

  it("6. treats hardened auth and additions as allowed (never violations)", () => {
    const report = diffSurfaces(SNAPSHOT, {
      ...SNAPSHOT,
      "GET /api/v1/favorites": backend("required"), // optional → required
      "POST /api/v1/themes": backend("required"), // brand new route
    });
    expect(report.violations).toEqual([]);
    expect(report.hardened).toEqual(["GET /api/v1/favorites"]);
    expect(report.additions).toEqual(["POST /api/v1/themes"]);
  });

  it("7. reports an empty diff for identical tables", () => {
    expect(diffSurfaces(SNAPSHOT, { ...SNAPSHOT })).toEqual({
      violations: [],
      additions: [],
      hardened: [],
    });
  });
});

describe("evaluateGate — the major-bump escape hatch (PF-013)", () => {
  it("8. passes identical surfaces regardless of version", () => {
    expect(evaluateGate(SNAPSHOT, { ...SNAPSHOT }, "1.0.0", "1.0.0").outcome).toBe("pass");
    expect(evaluateGate(SNAPSHOT, { ...SNAPSHOT }, "1.0.0", "2.3.4").outcome).toBe("pass");
  });

  it("9. fails a removal when the major version did not bump", () => {
    const current = { ...SNAPSHOT };
    delete current["GET /api/v1/effects"];
    // identical version
    expect(evaluateGate(SNAPSHOT, current, "1.0.0", "1.0.0").outcome).toBe("fail");
    // minor + patch movement is NOT an escape hatch
    expect(evaluateGate(SNAPSHOT, current, "1.0.0", "1.99.9").outcome).toBe("fail");
  });

  it("10. fails a weakened auth requirement without a major bump", () => {
    expect(
      evaluateGate(
        SNAPSHOT,
        { ...SNAPSHOT, "POST /api/v1/collections": backend("optional") },
        "1.0.0",
        "1.4.2",
      ).outcome,
    ).toBe("fail");
  });

  it("11. allows a removal WHEN the major version moved past the snapshot", () => {
    const current = { ...SNAPSHOT };
    delete current["GET /api/v1/effects"];
    const decision = evaluateGate(SNAPSHOT, current, "1.0.0", "2.0.0");
    expect(decision.outcome).toBe("major-bump-allowed");
    // violations are still reported — allowed, not hidden
    expect(decision.report.violations).toMatchObject([
      { key: "GET /api/v1/effects", kind: "removed" },
    ]);
  });

  it("12. always allows additions — pass with the additions listed", () => {
    const decision = evaluateGate(
      SNAPSHOT,
      { ...SNAPSHOT, "POST /api/v1/themes": backend("required") },
      "1.0.0",
      "1.0.0",
    );
    expect(decision.outcome).toBe("pass");
    expect(decision.report.additions).toEqual(["POST /api/v1/themes"]);
  });

  it("13. rejects unparseable version strings when violations exist", () => {
    const current = { ...SNAPSHOT };
    delete current["GET /api/health"];
    const decision = evaluateGate(SNAPSHOT, current, "1.0.0", "dev");
    expect(decision.outcome).toBe("invalid-versions");
    if (decision.outcome === "invalid-versions") {
      expect(decision.problem).toContain("could not parse semver");
    }
  });

  it("14. rejects a package version that went backwards below the snapshot", () => {
    const current = { ...SNAPSHOT };
    delete current["GET /api/health"];
    const decision = evaluateGate(SNAPSHOT, current, "2.0.0", "1.0.0");
    expect(decision.outcome).toBe("invalid-versions");
    if (decision.outcome === "invalid-versions") {
      expect(decision.problem).toContain("LOWER");
    }
  });
});

describe("renderSnapshot (PF-013)", () => {
  it("15. renders a deterministic, sorted, round-trippable snapshot", () => {
    const outOfOrder: Record<string, RouteEntry> = {
      "GET /api/v1/themes": backend("required"),
      "DELETE /api/v1/effects/:id": backend("required"),
      "GET /api/health": { origin: "frontend" },
    };
    const rendered = renderSnapshot("1.2.3", outOfOrder, {
      backend: 2,
      frontend: 1,
    });
    expect(rendered.endsWith("\n")).toBe(true);
    const parsed = JSON.parse(rendered) as ReturnType<
      typeof JSON.parse
    > as {
      comment: string;
      snapshotFormat: number;
      packageVersion: string;
      counts: { backend: number; frontend: number };
      routes: Record<string, RouteEntry>;
    };
    expect(parsed.snapshotFormat).toBe(1);
    expect(parsed.packageVersion).toBe("1.2.3");
    expect(parsed.counts).toEqual({ backend: 2, frontend: 1 });
    // Keys are sorted regardless of insertion order.
    expect(Object.keys(parsed.routes)).toEqual([
      "DELETE /api/v1/effects/:id",
      "GET /api/health",
      "GET /api/v1/themes",
    ]);
  });
});

describe("collectRoutes + readSnapshot — real tree sanity (PF-013)", () => {
  it("16. the walker sees the backend route table and valid auth levels", () => {
    const { routes, counts } = collectRoutes();
    // Ratchet floor, not an exact count: the snapshot pins the surface,
    // the gate (api-gate.yml) enforces exact drift — here we only pin
    // that the walker still finds the table it snapshots.
    expect(counts.backend).toBeGreaterThanOrEqual(250);
    expect(counts.frontend).toBeGreaterThanOrEqual(10);
    expect(routes["GET /api/v1"]).toEqual({ origin: "backend", auth: "none" });
    expect(routes["GET /api/v1/effects"]).toBeTruthy();
    for (const entry of Object.values(routes)) {
      if (entry.origin === "backend") {
        expect(["required", "optional", "none"]).toContain(entry.auth);
      } else {
        expect(entry.auth).toBeUndefined();
      }
    }
  });

  it("17. the committed snapshot parses with the expected shape", () => {
    const snapshot = readSnapshot();
    expect(snapshot.snapshotFormat).toBe(1);
    expect(snapshot.packageVersion).toMatch(/^\d+\.\d+\.\d+/);
    // counts are internally consistent with the route table
    const byOrigin = { backend: 0, frontend: 0 };
    for (const entry of Object.values(snapshot.routes)) {
      byOrigin[entry.origin]++;
    }
    expect(byOrigin).toEqual(snapshot.counts);
    // keys are sorted (renderSnapshot invariant, protects review diffs)
    const keys = Object.keys(snapshot.routes);
    expect(keys).toEqual([...keys].sort());
  });
});
