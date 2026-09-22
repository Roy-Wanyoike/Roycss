"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_ENTRIES } from "@/lib/faq-data";

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
// Q&A entries live in src/lib/faq-data.ts — the shared source of truth
// that also feeds the FAQPage JSON-LD emitted by src/app/page.tsx
// (issue #188 item 5), so structured data always matches rendered copy.

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
          {FAQ_ENTRIES.map((entry, i) => (
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
