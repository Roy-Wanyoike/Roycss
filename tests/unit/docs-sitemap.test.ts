import { describe, it, expect } from "vitest";
import {
  DOCS_CATEGORIES,
  DOCS_CURRENT_VERSION,
  DOCS_VERSIONS,
  resolveDocsVersion,
  getDocSourcePath,
  getAllDocPages,
} from "@/lib/docs-sitemap";

describe("docs versioning (issue #127)", () => {
  it("marks the declared current version as current", () => {
    const current = resolveDocsVersion(DOCS_CURRENT_VERSION);
    expect(current?.current).toBe(true);
    expect(current?.status).toBe("current");
  });

  it("resolves v1 as archived", () => {
    expect(resolveDocsVersion("v1")?.status).toBe("archived");
    expect(resolveDocsVersion("v1")?.current).toBe(false);
  });

  it("normalizes missing 'v' prefix", () => {
    expect(resolveDocsVersion("2")?.version).toBe("v2");
    expect(resolveDocsVersion("1")?.status).toBe("archived");
  });

  it("resolves per-minor snapshots of the current line as current", () => {
    expect(resolveDocsVersion("v2.1")?.current).toBe(true);
    expect(resolveDocsVersion("v2.3")?.status).toBe("current");
  });

  it("resolves per-minor snapshots of archived lines as archived", () => {
    expect(resolveDocsVersion("v1.2")?.status).toBe("archived");
  });

  it("returns undefined for non-version slugs (never mints a version)", () => {
    expect(resolveDocsVersion("getting-started")).toBeUndefined();
    expect(resolveDocsVersion("")).toBeUndefined();
    // "v" alone normalizes to "vv" → invalid.
    expect(resolveDocsVersion("v")).toBeUndefined();
  });

  it("declares every known version with a note", () => {
    for (const v of DOCS_VERSIONS) {
      expect(v.note.length).toBeGreaterThan(5);
      expect(v.label).toContain(v.version.slice(1));
    }
  });
});

describe("getDocSourcePath (edit-on-GitHub, issue #127)", () => {
  it("maps a known doc page to its route segment source", () => {
    const all = getAllDocPages();
    expect(all.length).toBeGreaterThan(10);
    const sample = all[0].slug; // e.g. "/docs/getting-started/installation"
    expect(getDocSourcePath(sample)).toBe(
      `src/app/docs/${sample.replace(/^\/docs\/?/, "")}/page.tsx`,
    );
  });

  it("maps the docs landing page", () => {
    expect(getDocSourcePath("/docs")).toBe("src/app/docs/page.tsx");
  });

  it("returns null for unknown paths", () => {
    expect(getDocSourcePath("/docs/nonexistent-page")).toBeNull();
    expect(getDocSourcePath("/effects")).toBeNull();
  });

  it("every mapped source path starts with src/app/docs/", () => {
    for (const page of getAllDocPages()) {
      const path = getDocSourcePath(page.slug);
      expect(path).toMatch(/^src\/app\/docs\/.+\/page\.tsx$/);
    }
  });

  it("sitemap categories are non-empty", () => {
    expect(DOCS_CATEGORIES.length).toBeGreaterThanOrEqual(4);
  });
});
