import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const SRC_DIR = join(ROOT, "src");

/**
 * Single toast system gate (issue #114, UIX F-14).
 *
 * The app used to ship TWO toast systems at once: the shadcn radix
 * `use-toast` hook + `<Toaster />` (src/hooks/use-toast.ts,
 * src/components/ui/{toast,toaster}.tsx) mounted in layout.tsx next to
 * sonner's `<Toaster />` — 27 pro components fired radix toasts while 8
 * auth/copy/newsletter call sites already used sonner, so users saw two
 * visually distinct toast styles depending on which feature they touched.
 *
 * This PR consolidates on sonner (`import { toast } from "sonner"` —
 * imperative, no provider): variant mapping destructive → toast.error,
 * default → toast(title, { description }). These source-level assertions
 * keep the old system from creeping back in.
 */

/** Every file under a directory (recursive, any extension — mirrors grep -r). */
function listAllFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listAllFiles(full));
    else out.push(full);
  }
  return out;
}

/** Every .ts/.tsx/.js/.jsx source file under a directory (recursive). */
function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("single toast system — sonner only (issue #114)", () => {
  it("scans a non-trivial source tree", () => {
    expect(listSourceFiles(SRC_DIR).length).toBeGreaterThan(400);
  });

  it("no use-toast / useToast references anywhere under src/", () => {
    const offenders: string[] = [];
    for (const file of listAllFiles(SRC_DIR)) {
      const src = readFileSync(file, "utf8");
      const lines = src.split("\n");
      for (const [i, line] of lines.entries()) {
        // The issue's gate grep: `use-toast|useToast|Toaster } from "@/components/ui/toaster"`
        if (/use-toast|useToast|Toaster \} from "@\/components\/ui\/toaster"/.test(line)) {
          offenders.push(
            `${file.slice(ROOT.length + 1)}:${i + 1}: ${line.trim().slice(0, 90)}`,
          );
        }
      }
    }
    expect(offenders, offenders.slice(0, 10).join("\n")).toEqual([]);
  });

  it("the radix toast system files are deleted", () => {
    expect(existsSync(join(SRC_DIR, "hooks/use-toast.ts"))).toBe(false);
    expect(existsSync(join(SRC_DIR, "components/ui/toaster.tsx"))).toBe(false);
    expect(existsSync(join(SRC_DIR, "components/ui/toast.tsx"))).toBe(false);
  });

  it("layout.tsx mounts exactly one Toaster — the sonner one", () => {
    const layout = readFileSync(join(SRC_DIR, "app/layout.tsx"), "utf8");
    const mounts = layout.match(/<Toaster\b/g) ?? [];
    expect(mounts.length).toBe(1);
    expect(layout).toContain('from "@/components/ui/sonner"');
    expect(layout).not.toContain("ui/toaster");
    // Same chrome the site's sonner toasts already had (auth flows, copy
    // actions, newsletter): bottom-right, richColors, close button — and
    // theme awareness comes from next-themes inside sonner.tsx.
    expect(layout).toMatch(/<Toaster position="bottom-right" richColors closeButton \/>/);
  });

  it("no @radix-ui/react-toast in package.json deps; sonner is declared", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    // Root manifest keeps app deps in devDependencies (the published `roycss`
    // npm package ships dist/ CSS only) — the radix toast primitive must be
    // gone from BOTH sections, and sonner must stay declared where the app
    // deps live.
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps["@radix-ui/react-toast"]).toBeUndefined();
    expect(pkg.dependencies["@radix-ui/react-toast"]).toBeUndefined();
    expect(pkg.devDependencies["@radix-ui/react-toast"]).toBeUndefined();
    expect(deps["sonner"]).toBeTruthy();
    // Repo-wide: the primitive has no importers left anywhere in src/.
    const offenders = listSourceFiles(SRC_DIR)
      .map((f) => readFileSync(f, "utf8"))
      .filter((s) => s.includes("@radix-ui/react-toast"));
    expect(offenders).toEqual([]);
  });

  it("the migration actually landed — sonner is the toast import everywhere", () => {
    // 27 migrated pro call sites + 8 pre-existing sonner users (auth flows,
    // copy-as-dropdown, roycss-page newsletter, roy-forms) + the Toaster
    // wrapper itself.
    const importers = listSourceFiles(SRC_DIR).filter((f) =>
      readFileSync(f, "utf8").includes('from "sonner"'),
    );
    expect(importers.length).toBeGreaterThan(30);
    // Spot-check the mapping contract on a migrated call site: destructive
    // radix toasts became toast.error(...).
    const live = readFileSync(
      join(SRC_DIR, "components/roycss/pro/roy-live.tsx"),
      "utf8",
    );
    expect(live).toContain('import { toast } from "sonner"');
    expect(live).toContain('toast.error("Room ID required")');
    expect(live).toContain('toast("Joined room", {');
  });
});
