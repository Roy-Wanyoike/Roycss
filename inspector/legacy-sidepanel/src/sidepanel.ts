/**
 * RoyCSS Inspector — side panel logic.
 *
 * The side panel is the deep-inspector surface. It:
 *  1. Renders the currently selected effect (description, CSS, framework tabs).
 *  2. Listens for `effect-selected` messages from the content script
 *     (badge click) and `scan-complete` messages (count update).
 *  3. Provides framework tabs (Vanilla / React / Vue / Angular / Svelte /
 *     Next.js) with install / import / usage snippets.
 *  4. Provides a copy-CSS button.
 *
 * Framework snippets are generated inline (mirroring
 * `/home/z/my-project/src/lib/framework-adapters.ts`) so the extension does
 * not need to ship that file. Keeping the generator local avoids bundling
 * the entire effects library + framework adapters as a dependency.
 */

/// <reference types="chrome" />

import { effectsData, effectsList, EFFECT_COUNT } from "./effects-data";
import type {
  EffectSelectedMessage,
  ScanCompleteMessage,
} from "./messages";

type FrameworkId = "vanilla" | "react" | "vue" | "angular" | "svelte" | "nextjs";

interface FrameworkTab {
  id: FrameworkId;
  label: string;
  install: string;
  importText: string;
  usage: (cls: string, name: string) => string;
}

const FRAMEWORKS: FrameworkTab[] = [
  {
    id: "vanilla",
    label: "Vanilla",
    install: `# CDN
curl -L https://unpkg.com/roycss/dist/roycss.min.css -o roycss.css

# Package manager
npm install roycss
pnpm add roycss
yarn add roycss
bun add roycss`,
    importText: `<link rel="stylesheet" href="roycss.css" />

<!-- Or via CDN -->
<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css" />`,
    usage: (cls, name) => `<button class="${cls}">${name}</button>`,
  },
  {
    id: "react",
    label: "React",
    install: `npm install roycss
pnpm add roycss
yarn add roycss
bun add roycss`,
    importText: `// src/main.tsx
import "roycss/dist/roycss.min.css";`,
    usage: (cls, name) => `export function Demo() {
  return (
    <button className="${cls}" type="button">
      ${name}
    </button>
  );
}`,
  },
  {
    id: "vue",
    label: "Vue 3",
    install: `npm install roycss
pnpm add roycss
yarn add roycss
bun add roycss`,
    importText: `// src/main.ts
import { createApp } from "vue";
import "roycss/dist/roycss.min.css";
import App from "./App.vue";

createApp(App).mount("#app");`,
    usage: (cls, name) => `<script setup lang="ts">
// CSS is global — nothing to import.
</script>

<template>
  <button class="${cls}" type="button">
    ${name}
  </button>
</template>`,
  },
  {
    id: "angular",
    label: "Angular",
    install: `npm install roycss
pnpm add roycss
yarn add roycss
bun add roycss

# Or with the Angular CLI
ng add roycss`,
    importText: `// angular.json
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
    usage: (cls, name) => `// app.component.ts
import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  template: \`
    <button class="${cls}" type="button">
      ${name}
    </button>
  \`,
})
export class AppComponent {}`,
  },
  {
    id: "svelte",
    label: "Svelte",
    install: `npm install roycss
pnpm add roycss
yarn add roycss
bun add roycss`,
    importText: `<!-- src/main.ts -->
import "roycss/dist/roycss.min.css";`,
    usage: (cls, name) => `<script lang="ts">
  // Class is global — nothing to import.
</script>

<button class="${cls}" type="button">
  ${name}
</button>`,
  },
  {
    id: "nextjs",
    label: "Next.js",
    install: `npm install roycss
pnpm add roycss
yarn add roycss
bun add roycss`,
    importText: `// src/app/layout.tsx
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
    usage: (cls, name) => `"use client";

export function Demo() {
  return (
    <button className="${cls}" type="button">
      ${name}
    </button>
  );
}`,
  },
];

let activeFramework: FrameworkId = "react";

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T =>
  document.querySelector(sel) as T;

function init(): void {
  renderFrameworkTabs();
  renderEffect(effectsList[0]);

  /* ─── Wire up copy button ──────────────────────────────────── */
  $("copy-css-btn").addEventListener("click", () => {
    const css = $("effect-css").textContent ?? "";
    void navigator.clipboard.writeText(css).then(() => {
      const btn = $<HTMLButtonElement>("copy-css-btn");
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    });
  });

  /* ─── Listen for messages from content script ──────────────── */
  chrome.runtime.onMessage.addListener(
    (message: EffectSelectedMessage | ScanCompleteMessage) => {
      if (!message || typeof message.type !== "string") return;
      if (message.type === "effect-selected") {
        const effect = effectsData.get(message.effectId);
        if (effect) {
          renderEffect(effect);
        } else {
          renderUnknownEffect(message.effectId, message.className);
        }
      } else if (message.type === "scan-complete") {
        $("page-count").textContent = String(message.count);
      }
    },
  );
}

function renderEffect(effect: {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  cssCode: string;
}): void {
  $("effect-name").textContent = effect.name;
  $("effect-category").textContent = effect.category;
  $("effect-description").textContent = effect.description;
  $("effect-class").textContent = `roycss-${effect.id}`;

  const tagsEl = $("effect-tags");
  tagsEl.innerHTML = "";
  for (const t of effect.tags) {
    const tag = document.createElement("span");
    tag.className = "roycss-sp__tag";
    tag.textContent = t;
    tagsEl.appendChild(tag);
  }

  const cssEl = $("effect-css");
  cssEl.innerHTML = "";
  cssEl.appendChild(highlightCss(effect.cssCode));

  renderFrameworkPanel(effect.id, effect.name);
}

function renderUnknownEffect(effectId: string, className: string): void {
  $("effect-name").textContent = effectId;
  $("effect-category").textContent = "not in dataset";
  $("effect-description").textContent =
    "This effect is not in the Inspector's embedded top-100 dataset. View it on the RoyCSS site for full details.";
  $("effect-class").textContent = className;

  const tagsEl = $("effect-tags");
  tagsEl.innerHTML = "";

  const cssEl = $("effect-css");
  cssEl.innerHTML = "";
  cssEl.textContent = `/* Effect ${effectId} is not embedded in the Inspector. */`;

  // Show a link to the RoyCSS site in the framework panel.
  const panel = $("framework-panel");
  panel.innerHTML = "";
  const link = document.createElement("a");
  link.href = `https://roycss.dev/?effect=${encodeURIComponent(effectId)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View on RoyCSS →";
  link.className = "roycss-sp__ext-link";
  panel.appendChild(link);
}

/* ─── CSS syntax highlighter (tiny, no deps) ─────────────────── */

/**
 * Wrap a CSS string in highlighted spans. Tokenization is intentionally
 * simple: comments, at-rules, selectors (lines ending with `{`), property:
 * value pairs, and brace delimiters. Built via DOM APIs — no innerHTML of
 * the raw CSS (defense against any future CSS-injection attempt).
 */
function highlightCss(css: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  // Split into rules by detecting `{` and `}`. Each rule has a selector
  // line and a body. We render line-by-line so the <pre> keeps formatting.
  const lines = css.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      frag.appendChild(document.createTextNode("\n"));
      continue;
    }
    if (trimmed.startsWith("/*")) {
      const span = document.createElement("span");
      span.className = "roycss-css-comment";
      span.textContent = line;
      frag.appendChild(span);
      frag.appendChild(document.createTextNode("\n"));
      continue;
    }
    if (trimmed.startsWith("@")) {
      const span = document.createElement("span");
      span.className = "roycss-css-atrule";
      span.textContent = line;
      frag.appendChild(span);
      frag.appendChild(document.createTextNode("\n"));
      continue;
    }
    if (trimmed.endsWith("{") || trimmed === "}") {
      const span = document.createElement("span");
      span.className = "roycss-css-selector";
      span.textContent = line;
      frag.appendChild(span);
      frag.appendChild(document.createTextNode("\n"));
      continue;
    }
    // Property: value; line.
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const prop = document.createElement("span");
      prop.className = "roycss-css-prop";
      prop.textContent = line.slice(0, colonIdx + 1);
      frag.appendChild(prop);
      const val = document.createElement("span");
      val.className = "roycss-css-val";
      val.textContent = line.slice(colonIdx + 1);
      frag.appendChild(val);
      frag.appendChild(document.createTextNode("\n"));
      continue;
    }
    frag.appendChild(document.createTextNode(line + "\n"));
  }
  return frag;
}

/* ─── Framework tabs ─────────────────────────────────────────── */

function renderFrameworkTabs(): void {
  const tablist = $("framework-tabs");
  tablist.innerHTML = "";
  for (const fw of FRAMEWORKS) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.role = "tab";
    tab.textContent = fw.label;
    tab.dataset.fw = fw.id;
    tab.className = "roycss-sp__tab";
    tab.setAttribute("aria-selected", String(fw.id === activeFramework));
    if (fw.id === activeFramework) {
      tab.classList.add("roycss-sp__tab--active");
    }
    tab.addEventListener("click", () => {
      activeFramework = fw.id;
      for (const t of tablist.children) {
        const btn = t as HTMLButtonElement;
        const isActive = btn.dataset.fw === activeFramework;
        btn.setAttribute("aria-selected", String(isActive));
        btn.classList.toggle("roycss-sp__tab--active", isActive);
      }
      // Re-render the panel for the currently shown effect.
      const effectId = $("effect-class").textContent?.replace(/^roycss-/, "") ?? "";
      const effect = effectsData.get(effectId);
      if (effect) renderFrameworkPanel(effect.id, effect.name);
    });
    tablist.appendChild(tab);
  }
}

function renderFrameworkPanel(effectId: string, effectName: string): void {
  const fw = FRAMEWORKS.find((f) => f.id === activeFramework) ?? FRAMEWORKS[0];
  const cls = `roycss-${effectId}`;
  const safeName = effectName.replace(/[<>"'`]/g, "").trim() || "Effect";
  const panel = $("framework-panel");
  panel.innerHTML = "";

  const installBlock = makeCodeBlock("Install", fw.install);
  panel.appendChild(installBlock);

  const importBlock = makeCodeBlock("Import", fw.importText);
  panel.appendChild(importBlock);

  const usageBlock = makeCodeBlock("Usage", fw.usage(cls, safeName));
  panel.appendChild(usageBlock);
}

function makeCodeBlock(title: string, code: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "roycss-sp__codeblock";

  const head = document.createElement("div");
  head.className = "roycss-sp__codeblock-head";

  const titleEl = document.createElement("span");
  titleEl.className = "roycss-sp__codeblock-title";
  titleEl.textContent = title;
  head.appendChild(titleEl);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "roycss-sp__copy roycss-sp__copy--small";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    void navigator.clipboard.writeText(code).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1500);
    });
  });
  head.appendChild(copyBtn);

  wrap.appendChild(head);

  const pre = document.createElement("pre");
  pre.className = "roycss-sp__code roycss-sp__code--sm";
  const codeEl = document.createElement("code");
  codeEl.textContent = code;
  pre.appendChild(codeEl);
  wrap.appendChild(pre);

  return wrap;
}

document.addEventListener("DOMContentLoaded", init);

/* ─── Surface EFFECT_COUNT in dev tools for sanity check ─────── */
console.debug(`[RoyCSS Inspector] side panel ready · ${EFFECT_COUNT} effects embedded`);
