"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

/* ─── FAQ Item ─────────────────────────────────────────────── */
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="roycss-faq-item" data-open={isOpen}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          className="roycss-faq-trigger"
          aria-expanded={isOpen}
        >
          <span>{question}</span>
          <ChevronDown className="roycss-faq-chevron size-4" />
        </button>
      </h3>
      <div className="roycss-faq-content">
        <div className="roycss-faq-content-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Section ───────────────────────────────────────────── */
const faqEntries: Array<{ question: string; answer: string }> = [
  {
    question: "Does RoyCSS work with React/Vue/Angular/Svelte?",
    answer:
      "Yes. RoyCSS is pure CSS — import the stylesheet once and use any .roycss-* class in any framework. Framework-specific examples and adapters are included for React, Vue, Angular, Svelte, and Next.js.",
  },
  {
    question: "Does RoyCSS include JavaScript?",
    answer:
      "No. Every effect is 100% CSS. Zero runtime JavaScript, zero hydration cost. The showcase site uses JavaScript for interactivity, but the library itself is pure CSS.",
  },
  {
    question: "What's the bundle size?",
    answer:
      "Only ~10KB of CSS loads initially — the rest is lazy-loaded on demand as you scroll. Each effect averages ~1KB. Use the CLI to tree-shake and include only what you need. The full minified bundle is 990KB for all 1,569 effects, but most projects use <50KB.",
  },
  {
    question: "Does it support dark mode?",
    answer:
      "Yes. RoyCSS uses OKLCH colors with light-dark() support and a .dark class override system. Theme preferences are persisted via localStorage and respect the user's OS prefers-color-scheme setting.",
  },
  {
    question: "Is it accessible?",
    answer:
      "Yes. All effects respect prefers-reduced-motion. Focus-visible rings are built in. WCAG 2.2 AA compliant. The platform includes a built-in Accessibility Suite that audits your pages for 10 WCAG criteria, computes contrast ratios, and visualizes tab order.",
  },
  {
    question: "Can I customize colors?",
    answer:
      "Yes. Click any effect to open the detail dialog, then use the color palette or type a custom hex code. The Theme System provides 10 production-ready presets (Emerald, Healthcare, Banking, Corporate, Education, Gaming, SaaS, Dashboard, Fintech, Apple Material). The Theme Builder lets you create custom themes visually and export CSS variables.",
  },
  {
    question: "Is there an MCP server for AI assistants?",
    answer:
      "Yes. The RoyCSS MCP Server gives AI assistants (Claude, ChatGPT, Cursor, Windsurf, Codex) access to all 1569+ effects, 12 recipes, 10 patterns, framework examples, and design tokens via 15 tools. Once configured, your AI can search effects, get CSS code, validate class names, suggest effects for intents, and generate accurate RoyCSS — no hallucination.",
  },
  {
    question: "What are RoyCSS Platform Products?",
    answer:
      "RoyCSS has evolved into a complete Frontend Engineering Platform with 30+ interconnected products across 9 domains: Core Framework (CSS, CLI, Components, Motion, Icons), Developer Tools (40+ tools, Inspector, DevTools), AI Platform (RoyAI, Agents, MCP Hub, Architect), Design Platform (Studio, Theme Builder, Token Studio, Storybook), Content & Learning (Docs, Recipes, Academy, Blueprints, Showcase), Marketplace (Blocks, Templates, Plugin Hub), Cloud & Enterprise (Cloud, Enterprise, Analytics), Collaboration (Community, Live, Hiring), and Delivery (Deploy, Benchmark).",
  },
  {
    question: "What is the RoyCSS CLI and what commands does it support?",
    answer:
      "The RoyCSS CLI (roycss-cli) is a command-line tool with 13 commands: init, add, search, list, categories, info, doctor, create, upgrade, stats, browse, export, and plugin. Install globally with 'npm install -g roycss-cli' or use 'npx roycss-cli <command>'. The CLI supports framework-aware initialization (React, Vue, Angular, Svelte, Next.js), tree-shaking exports, project health checks, and deprecated-pattern migration.",
  },
  {
    question: "Does RoyCSS support cross-platform development?",
    answer:
      "The Roy Platform vision includes cross-platform support via Roy Tokens — a design token engine that generates CSS Variables, JSON, Flutter ThemeData, SwiftUI Colors, Compose Themes, Tailwind Config, and Figma Tokens from a single source of truth. Roy Native (React Native), Roy Flutter, Roy SwiftUI, and Roy Compose adapters are on the roadmap. The design tokens become the single source of truth across all platforms.",
  },
  {
    question: "How does the AI integration work?",
    answer:
      "RoyCSS includes three AI products: (1) RoyAI — a chat assistant that generates CSS effects, answers questions, and helps with RoyCSS usage. (2) Roy Agents — specialized AI agents for accessibility, performance, documentation, refactoring, design review, migration, and test generation. (3) MCP Hub — structured AI access to all RoyCSS knowledge via the Model Context Protocol. All AI tools use the z-ai-web-dev-sdk and are rate-limited (10 requests/minute per IP) with CSRF protection.",
  },
  {
    question: "What are Roy Blocks and Blueprints?",
    answer:
      "Roy Blocks are production-ready application sections (auth flows, billing pages, CRM modules, dashboards, settings, team management) that developers can assemble. Roy Blueprints are complete application architectures (Hospital, POS, ERP, HR, Banking, Education) with folder structure, APIs, authentication, deployment guidance, and testing strategy. Both are available in the Marketplace with live previews and source code.",
  },
  {
    question: "Is RoyCSS production-ready?",
    answer:
      "Yes. RoyCSS passes ESLint with 0 errors, TypeScript strict mode with 0 errors, and production builds successfully. The platform includes: strict CSP headers (default-src 'self', frame-ancestors 'none'), X-Frame-Options: DENY, HSTS, rate limiting (AI routes 10/min, contact 5/min), CSRF protection via Origin verification, Prisma ORM with PostgreSQL-ready schema, LRU caching, structured JSON logging, and graceful shutdown. WCAG 2.2 AA contrast verified (primary 5.32:1 in light mode).",
  },
  {
    question: "What is the backend architecture?",
    answer:
      "RoyCSS includes a standalone Express 4 + TypeScript backend in the backend/ folder. It features: modular architecture (effects, recipes, patterns, contact, auth, health modules), JWT authentication with refresh tokens, Prisma ORM (SQLite dev / PostgreSQL production), Zod validation on every route, in-memory LRU cache, sliding-window rate limiting, Helmet security headers, structured JSON logging with requestId correlation, centralized error handling, and graceful shutdown (SIGINT/SIGTERM). Run independently: 'cd backend && bun install && bun run dev' on port 4000.",
  },
  {
    question: "How do I contribute to RoyCSS?",
    answer:
      "RoyCSS is open source (MIT license). Visit the GitHub repository to contribute effects, tools, themes, or documentation. The Community Hub features discussions, Q&A, snippet sharing, challenges, RFC voting, and roadmap feedback. Certified developers can join the Roy Hiring platform to showcase their skills. The Academy offers 4 certification levels: Associate, Professional, Expert, and Architect.",
  },
  {
    question: "What are Roy Recipes and how are they different from documentation?",
    answer:
      "Roy Recipes are problem-based solutions, not utility documentation. Instead of reading 'grid utilities', developers search 'SaaS Pricing Page' or 'CRM Dashboard' and get a complete implementation with UX rationale, components used, accessibility notes, performance tips, and best practices. The platform includes 12 recipes covering hero sections, loading states, feature cards, glass UI, navigation, login forms, notifications, empty states, and CTAs. The Recipe format is open for community contributions.",
  },
  {
    question: "Does RoyCSS work with design tools like Figma?",
    answer:
      "The Roy Token Studio (roadmap) will provide visual design token management with Figma synchronization, JSON export, CSS variable export, and enterprise governance. The Theme System already supports exporting CSS variables for integration with any design pipeline. Roy Tokens will eventually generate Flutter ThemeData, SwiftUI Colors, and Compose Themes from the same source.",
  },
  {
    question: "What is Roy Labs?",
    answer:
      "Roy Labs is an experimental workspace for early access to AI-powered utilities, experimental CSS features, new browser APIs, and prototype components. It allows innovation without affecting the stable release. Developers can test cutting-edge features and provide feedback before they graduate to the stable RoyCSS release.",
  },
  {
    question: "How does RoyCSS handle performance?",
    answer:
      "RoyCSS is built for performance: (1) Lazy CSS injection — only visible effects' CSS is injected (MutationObserver-based). (2) CLS = 0.0000 (zero layout shift). (3) GPU-accelerated animations (transform/opacity only). (4) content-visibility: auto on cards for render optimization. (5) Tree-shakeable exports via CLI. (6) No JavaScript runtime. (7) Font loading via next/font with display: swap. (8) The Performance Analyzer tool scores CSS on 13 metrics with actionable fixes.",
  },
  {
    question: "What enterprise features does RoyCSS offer?",
    answer:
      "RoyCSS Enterprise (roadmap) includes: private package registry, team collaboration, SSO/SAML, audit logs, custom SLAs, priority support, on-premise deployment, enterprise governance for design tokens, dedicated training, and a verified credential registry. The backend already supports JWT auth, rate limiting, and Prisma with PostgreSQL for enterprise-scale data. The Accessibility Suite provides WCAG compliance auditing for enterprise teams.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" aria-label="Frequently asked questions" className="py-16 sm:py-20 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
            <HelpCircle className="size-3.5" />
            FAQ
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to know about RoyCSS — frameworks, performance,
            accessibility, and customization.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqEntries.map((entry, i) => (
            <FAQItem
              key={entry.question}
              question={entry.question}
              answer={entry.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
