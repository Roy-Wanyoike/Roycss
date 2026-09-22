import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { pageMeta } from "@/lib/seo";
import { FAQ_ENTRIES, faqPageJsonLd } from "@/lib/faq-data";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const ROOT = join(__dirname, "..", "..");

/**
 * SEO discoverability contract (issues #187 + #188, go-live batch).
 *
 * Pins the fixes that the go-live audit (QA round 9-d) flagged:
 *   1. NO root-level canonical — the old `alternates.canonical: "/"` in
 *      layout.tsx was inherited by ~40 pages, folding them into the
 *      homepage. Pages declare self-canonicals via pageMeta() instead.
 *   2. /docs is a real 308 (next.config redirects), not a meta-refresh shell.
 *   3. sitemap.xml lists /roadmap + /privacy + /terms with a deterministic
 *      lastModified and does NOT list the redirecting /docs URL.
 *   4. robots.txt disallows /api/ (allowing /api/og), /verify-email,
 *      /reset-password.
 *   5. Home JSON-LD is an @graph with WebSite + Organization + the existing
 *      SoftwareApplication; the FAQPage JSON-LD questions/answers match the
 *      rendered FAQ content exactly (same data module).
 *   6. Every docs page carries its own self-canonical path in source.
 */

describe("pageMeta helper (#187)", () => {
  it("composes title/description + self-canonical + OG + twitter", () => {
    const meta = pageMeta({
      title: "T — RoyCSS Docs",
      description: "d".repeat(50),
      path: "/docs/getting-started/cli",
    });
    expect(meta.title).toBe("T — RoyCSS Docs");
    expect(meta.alternates?.canonical).toBe("/docs/getting-started/cli");
    expect(meta.openGraph?.url).toBe("/docs/getting-started/cli");
    expect(meta.openGraph?.title).toBe("T — RoyCSS Docs");
    expect(meta.openGraph?.images?.[0]).toMatchObject({ url: "/api/og" });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/api/og"],
    });
  });

  it("accepts a custom ogImage", () => {
    const meta = pageMeta({
      title: "T",
      description: "d",
      path: "/roadmap",
      ogImage: "/og.png",
    });
    expect(meta.openGraph?.images?.[0]).toMatchObject({ url: "/og.png" });
    expect(meta.twitter?.images).toEqual(["/og.png"]);
  });

  it("canonicals stay relative so metadataBase keeps origin control (#113)", () => {
    const meta = pageMeta({ title: "T", description: "d", path: "/privacy" });
    expect(String(meta.alternates?.canonical)).not.toContain("http");
  });
});

describe("root layout — no canonical default (#187) + @graph (#188)", () => {
  const src = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");

  it("does not set a root-level alternates.canonical", () => {
    expect(src).not.toMatch(/alternates:\s*\{[\s\S]*?canonical/);
    // metadataBase stays — it is what resolves every relative canonical.
    expect(src).toContain('metadataBase: new URL("https://roycss.com")');
  });

  it("home title leads with the primary query (#188 item 3)", () => {
    expect(src).toContain(
      '"RoyCSS — CSS Effects Library & AI-Native Frontend Platform"',
    );
  });

  it("JSON-LD is an @graph with SoftwareApplication + WebSite + Organization", () => {
    expect(src).toContain('"@graph"');
    expect(src).toContain('"SoftwareApplication"');
    expect(src).toContain('"WebSite"');
    expect(src).toContain('"Organization"');
  });
});

describe("home FAQPage JSON-LD (#188 item 5)", () => {
  it("is built from the same data module the FAQ section renders", () => {
    const faqSection = readFileSync(
      join(ROOT, "src/components/roycss/faq-section.tsx"),
      "utf8",
    );
    expect(faqSection).toContain('from "@/lib/faq-data"');
    expect(faqSection).not.toContain("faqEntries: Array<");
  });

  it("emits a Question + acceptedAnswer pair for every rendered entry", () => {
    const ld = faqPageJsonLd();
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(FAQ_ENTRIES.length);
    for (const [i, q] of ld.mainEntity.entries()) {
      expect(q.name).toBe(FAQ_ENTRIES[i].question);
      expect(q.acceptedAnswer.text).toBe(FAQ_ENTRIES[i].answer);
    }
  });

  it("home page emits the JSON-LD server-side", () => {
    const pageSrc = readFileSync(join(ROOT, "src/app/page.tsx"), "utf8");
    expect(pageSrc).toContain("faqPageJsonLd");
    expect(pageSrc).toContain("application/ld+json");
  });
});

describe("robots.txt (#188 item 2)", () => {
  it("disallows the API surface and auth token pages, allowing /api/og", () => {
    const txt = robots();
    expect(txt.sitemap).toBe("https://roycss.com/sitemap.xml");
    const rules = Array.isArray(txt.rules) ? txt.rules : [txt.rules];
    const star = rules.filter((r) => r.userAgent === "*");
    const disallow = star.flatMap((r) => r.disallow ?? []);
    const allow = star.flatMap((r) => r.allow ?? []);
    expect(disallow).toContain("/api/");
    expect(disallow).toContain("/verify-email");
    expect(disallow).toContain("/reset-password");
    expect(allow).toContain("/api/og");
  });
});

describe("sitemap.xml (#188 item 1)", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists the standalone info pages", () => {
    expect(urls).toContain("https://roycss.com/roadmap");
    expect(urls).toContain("https://roycss.com/privacy");
    expect(urls).toContain("https://roycss.com/terms");
  });

  it("still enumerates the effect catalog and docs routes", () => {
    // 1,959 effect pages + 29 category landing pages (issue #198), all
    // under /effects/ — the catalog enumeration must not shrink.
    const effectUrls = urls.filter((u) =>
      u.startsWith("https://roycss.com/effects/"),
    );
    expect(effectUrls).toHaveLength(1959 + 29);
    expect(
      effectUrls.filter((u) => u.includes("/effects/category/")),
    ).toHaveLength(29);
    expect(urls.filter((u) => u.startsWith("https://roycss.com/docs/")))
      .toHaveLength(36); // 37 docs pages minus the redirecting /docs itself
  });

  it("never lists the redirecting /docs URL (#187)", () => {
    expect(urls).not.toContain("https://roycss.com/docs");
  });

  it("uses one deterministic lastModified for every URL", () => {
    const lastMods = new Set(
      entries.map((e) => (e.lastModified instanceof Date
        ? e.lastModified.getTime()
        : String(e.lastModified))),
    );
    expect(lastMods.size).toBe(1);
    // Module-level constant — not `new Date()` at build time.
    const sitemapSrc = readFileSync(join(ROOT, "src/app/sitemap.ts"), "utf8");
    expect(sitemapSrc).toMatch(/const LAST_MODIFIED = new Date\("/);
    expect(sitemapSrc).not.toMatch(/const lastModified = new Date\(\)/);
  });
});

describe("/docs is a real redirect (#187)", () => {
  it("next.config redirects /docs → /docs/getting-started permanently (308)", () => {
    const configSrc = readFileSync(join(ROOT, "next.config.ts"), "utf8");
    expect(configSrc).toContain('source: "/docs"');
    expect(configSrc).toContain('destination: "/docs/getting-started"');
    expect(configSrc).toMatch(/permanent:\s*true/);
  });

  it("the fallback page stays a plain redirect without metadata", () => {
    const pageSrc = readFileSync(
      join(ROOT, "src/app/docs/page.tsx"),
      "utf8",
    );
    expect(pageSrc).toContain('redirect("/docs/getting-started")');
    expect(pageSrc).not.toContain("export const metadata");
  });
});

describe("docs pages carry self-canonicals (#187 mechanical pass)", () => {
  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else if (entry === "page.tsx") out.push(full);
    }
    return out;
  }

  it("every static docs page passes its route to pageMeta()", () => {
    const offenders: string[] = [];
    let checked = 0;
    for (const file of walk(join(ROOT, "src/app/docs"))) {
      const route = `/docs/${relative(join(ROOT, "src/app/docs"), file)
        .replace(/[/\\]page\.tsx$/, "")}`;
      if (route === "/docs" || route.includes("[version]")) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("export const metadata")) continue; // redirect shells
      checked++;
      if (!src.includes(`path: "${route}"`)) {
        offenders.push(route);
      }
    }
    expect(checked).toBe(35);
    expect(offenders).toEqual([]);
  });
});
