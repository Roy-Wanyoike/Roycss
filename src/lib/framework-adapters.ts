/**
 * framework-adapters.ts
 *
 * Generates framework-specific install / import / usage snippets for any
 * RoyCSS effect. Supports 6 framework targets: Vanilla HTML, React, Vue 3,
 * Angular, Svelte and Next.js.
 *
 * Each example contains:
 *  - install: shell command to add RoyCSS to the project
 *  - import:  the framework-appropriate import line(s)
 *  - usage:   a copy-pasteable snippet that drops the effect into the
 *             framework's idiomatic component syntax.
 */

export type FrameworkId =
  | "vanilla"
  | "react"
  | "vue"
  | "angular"
  | "svelte"
  | "nextjs";

export interface FrameworkExample {
  id: FrameworkId;
  label: string;
  /** Short tagline describing the integration model. */
  description: string;
  install: string;
  import: string;
  usage: string;
}

export const frameworkLabels: Record<FrameworkId, string> = {
  vanilla: "Vanilla HTML",
  react: "React",
  vue: "Vue 3",
  angular: "Angular",
  svelte: "Svelte",
  nextjs: "Next.js",
};

/**
 * Build a CSS class name for a given effect id (matches the convention used
 * across the RoyCSS library: `roycss-<id>`).
 */
function classNameFor(effectId: string): string {
  return `roycss-${effectId}`;
}

/**
 * Returns six framework-specific code examples (install / import / usage)
 * for the provided RoyCSS effect.
 */
export function getFrameworkExamples(
  effectId: string,
  effectName: string,
): FrameworkExample[] {
  const cls = classNameFor(effectId);
  const safeName = effectName.replace(/[<>"'`]/g, "").trim() || "Effect";

  return [
    /* ──────────────── 1. Vanilla HTML ──────────────── */
    {
      id: "vanilla",
      label: frameworkLabels.vanilla,
      description: "Drop-in stylesheet + class — zero build step required.",
      install: `# Option 1: CDN (no install)
curl -L https://unpkg.com/roycss/dist/roycss.min.css -o roycss.css

# Option 2: npm
npm install roycss`,
      import: `<link rel="stylesheet" href="roycss.css" />

<!-- Or via CDN directly -->
<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css" />`,
      usage: `<button class="${cls}">${safeName}</button>

<!-- The class can be applied to any element -->
<div class="${cls}">Hover or focus me</div>`,
    },

    /* ──────────────── 2. React ──────────────── */
    {
      id: "react",
      label: frameworkLabels.react,
      description: "Import once at the app root — use the class everywhere.",
      install: `# npm
npm install roycss

# pnpm
pnpm add roycss

# yarn
yarn add roycss`,
      import: `// src/main.tsx (or src/index.tsx)
import "roycss/dist/roycss.min.css";`,
      usage: `export function Demo() {
  return (
    <button className="${cls}" type="button">
      ${safeName}
    </button>
  );
}`,
    },

    /* ──────────────── 3. Vue 3 ──────────────── */
    {
      id: "vue",
      label: frameworkLabels.vue,
      description: "Single global import — works in Options & Composition API.",
      install: `# npm
npm install roycss

# pnpm
pnpm add roycss

# yarn
yarn add roycss`,
      import: `<!-- src/main.ts -->
import { createApp } from "vue";
import "roycss/dist/roycss.min.css";
import App from "./App.vue";

createApp(App).mount("#app");`,
      usage: `<script setup lang="ts">
// No per-component import needed — CSS is global.
</script>

<template>
  <button class="${cls}" type="button">
    ${safeName}
  </button>
</template>`,
    },

    /* ──────────────── 4. Angular ──────────────── */
    {
      id: "angular",
      label: frameworkLabels.angular,
      description: "Add to angular.json styles array — class is app-wide.",
      install: `# npm
npm install roycss

# yarn
yarn add roycss

# Or with the Angular CLI
ng add roycss`,
      import: `// angular.json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/roycss/dist/roycss.min.css",
              "src/styles.css"
            ]
          }
        }
      }
    }
  }
}`,
      usage: `// app.component.ts
import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  template: \`
    <button class="${cls}" type="button">
      ${safeName}
    </button>
  \`,
})
export class AppComponent {}`,
    },

    /* ──────────────── 5. Svelte ──────────────── */
    {
      id: "svelte",
      label: frameworkLabels.svelte,
      description: "Global import in entry — usable in any .svelte file.",
      install: `# npm
npm install roycss

# pnpm
pnpm add roycss

# yarn
yarn add roycss`,
      import: `<!-- src/main.ts (or src/main.js) -->
import "roycss/dist/roycss.min.css";`,
      usage: `<script lang="ts">
  // Class is global — nothing to import here.
</script>

<button class="${cls}" type="button">
  ${safeName}
</button>`,
    },

    /* ──────────────── 6. Next.js ──────────────── */
    {
      id: "nextjs",
      label: frameworkLabels.nextjs,
      description: "Import in the root layout — works with App Router & SSR.",
      install: `# npm
npm install roycss

# pnpm
pnpm add roycss

# yarn
yarn add roycss

# bun
bun add roycss`,
      import: `// src/app/layout.tsx
import type { Metadata } from "next";
import "roycss/dist/roycss.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Next.js App",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
      usage: `"use client";

export function Demo() {
  return (
    <button className="${cls}" type="button">
      ${safeName}
    </button>
  );
}`,
    },
  ];
}

/**
 * Default export of the six framework examples for tooling that prefers
 * a single-value import.
 */
export const defaultFrameworkExamples: FrameworkExample[] = getFrameworkExamples(
  "btn-shine",
  "Shine Button",
);
