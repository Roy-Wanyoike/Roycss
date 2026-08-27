import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Framework Guides — RoyCSS Docs",
  description: "Use RoyCSS with React, Vue, Svelte, Angular, and Astro. Plain CSS — no framework adapter required.",
};

export default function FrameworksPage() {
  return (
    <>
      <h1>Framework Guides</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is framework-agnostic — it’s plain CSS. You import it
        once in your app’s global stylesheet and apply classes via
        your framework’s normal <code>className</code>/<code>class</code>{" "}
        attributes. Below are copy-pasteable setup snippets for the
        five frameworks we officially support.
      </p>

      <h2 id="react-next">React / Next.js</h2>
      <p>
        Import the categories you need in your root layout or global
        stylesheet. With Turbopack and webpack both, unused categories
        are tree-shaken automatically.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`// app/globals.css
@import "roycss/effects/hover.css";
@import "roycss/effects/buttons.css";

// Or, in app/layout.tsx
import "roycss/effects/hover.css";
import "roycss/effects/buttons.css";`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`export function SaveButton() {
  return (
    <button type="button" className="r-btn-glow-emerald r-hover-lift">
      Save
    </button>
  );
}`}</code>
      </pre>

      <h2 id="vue-nuxt">Vue / Nuxt</h2>
      <p>
        In Nuxt, add the imports to your <code>nuxt.config</code>{" "}
        CSS array so they’re bundled globally:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`// nuxt.config.ts
export default defineNuxtConfig({
  css: [
    "roycss/effects/hover.css",
    "roycss/effects/buttons.css",
  ],
});`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<script setup lang="ts">
// No JS needed — classes are global.
</script>

<template>
  <button type="button" class="r-btn-glow-emerald">
    Save
  </button>
</template>`}</code>
      </pre>

      <h2 id="svelte-kit">Svelte / SvelteKit</h2>
      <p>
        Import in your root <code>+layout.svelte</code> so the
        stylesheet is included on every route:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<!-- src/routes/+layout.svelte -->
<script>
  import "roycss/effects/hover.css";
  import "roycss/effects/buttons.css";
</script>

<slot />`}</code>
      </pre>

      <h2 id="angular">Angular</h2>
      <p>
        Add the RoyCSS imports to your <code>angular.json</code>{" "}
        styles array, or import them in <code>styles.css</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* styles.css */
@import "roycss/effects/hover.css";
@import "roycss/effects/buttons.css";`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`// save-button.component.ts
@Component({
  selector: "app-save-button",
  template: \`
    <button type="button" class="r-btn-glow-emerald">
      Save
    </button>
  \`,
})
export class SaveButtonComponent {}`}</code>
      </pre>

      <h2 id="astro">Astro</h2>
      <p>
        Astro treats CSS imports as build-time assets. Import once in
        a layout and the classes are available everywhere:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`---
// src/layouts/BaseLayout.astro
import "roycss/effects/hover.css";
import "roycss/effects/buttons.css";
---
<html>
  <body>
    <slot />
  </body>
</html>`}</code>
      </pre>

      <h2 id="ssr">Server-side rendering</h2>
      <p>
        Because RoyCSS is plain CSS, there is no hydration mismatch,
        no flash of unstyled content, and no client-side runtime. The
        first paint already shows the correct effect states.
      </p>

      <h2 id="tailwind">Using alongside Tailwind</h2>
      <p>
        RoyCSS and Tailwind coexist cleanly. RoyCSS class names are
        prefixed with <code>r-</code> and never collide with Tailwind
        utilities. Compose them in any order:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button className="px-4 py-2 rounded-md r-hover-lift r-btn-glow-emerald">
  Save
</button>`}</code>
      </pre>
    </>
  );
}
