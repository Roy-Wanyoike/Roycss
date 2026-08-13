"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, HelpCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/* ─── Pricing tier data ─────────────────────────────────────── */
interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaAction: () => void;
  ctaVariant: "default" | "outline" | "secondary";
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Everything you need to explore the full CSS library and start building.",
    features: [
      "All 1,749 CSS effects",
      "13 open-source platform products",
      "Community support",
      "MIT License",
      "No credit card required",
    ],
    cta: "Get Started",
    ctaVariant: "outline",
    ctaAction: () => {
      const el = document.querySelector("#get-started");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    description: "For individual developers who want the full design + AI + dev toolkit.",
    features: [
      "Everything in Free",
      "33 Pro platform products",
      "8 AI agents (RoyAI, Architect, Review, etc.)",
      "Full design suite (Color, Gradient, Typography, Layout, Motion Studio)",
      "Full build tools (Forms, Blueprints, Data Grid, Kanban, Charts)",
      "Dev tools (Profiler, Bundle, Benchmark, Observatory)",
      "Priority email support",
    ],
    cta: "Start Pro Trial",
    ctaVariant: "default",
    popular: true,
    ctaAction: () => {
      toast({ title: "Pro trial coming soon!", description: "We'll notify you the moment Pro trials open up." });
    },
  },
  {
    name: "Team",
    price: "$39",
    period: "/mo",
    description: "For growing teams that need collaboration, sync, and shared workspaces.",
    features: [
      "Everything in Pro",
      "7 Team products (Workspace, Sync, Live, Preview, Deploy, Marketplace, Plugins)",
      "Up to 10 seats",
      "Team collaboration features",
      "Priority + Slack support",
    ],
    cta: "Start Team Trial",
    ctaVariant: "default",
    ctaAction: () => {
      toast({ title: "Team trial coming soon!", description: "We'll reach out when Team trials are available." });
    },
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations that need governance, compliance, SSO, and an SLA.",
    features: [
      "Everything in Team",
      "9 Enterprise products (Fleet, Governance, Compliance, Audit, CDN, Storage, Edge, Digital Twin, OS)",
      "Unlimited seats",
      "SSO (GitHub/Google/SAML)",
      "RBAC + audit logs (90 days)",
      "Custom branding / white-label",
      "99.9% uptime SLA",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline",
    ctaAction: () => {
      toast({ title: "Let's talk enterprise", description: "Our sales team will reach out shortly to schedule a call." });
    },
  },
];

/* ─── Quick FAQ ─────────────────────────────────────────────── */
const pricingFaq: Array<{ question: string; answer: string }> = [
  { question: "Can I change plans anytime?", answer: "Yes." },
  { question: "Can I cancel anytime?", answer: "Yes." },
  { question: "Do you offer student discounts?", answer: "Yes, 50% off Pro." },
  { question: "Do you offer open-source discounts?", answer: "Yes, free Pro for qualifying projects." },
];

/* ─── Pricing Section ───────────────────────────────────────── */
export function PricingSection() {
  return (
    <section id="pricing" aria-label="Pricing" className="py-16 sm:py-20 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
            <Sparkles className="size-3.5" />
            Pricing
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            From free to enterprise — there&apos;s a plan for every team.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={tier.popular ? "lg:-translate-y-2 h-full" : "h-full"}
            >
              <Card
                className={`relative h-full flex flex-col gap-5 py-6 ${
                  tier.popular
                    ? "border-primary shadow-lg ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="px-6 gap-2">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {tier.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display text-4xl font-bold text-foreground tabular-nums">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm text-muted-foreground">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {tier.description}
                  </p>
                </CardHeader>

                <CardContent className="px-6 flex-1">
                  <ul className="space-y-2.5" role="list">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                            tier.popular
                              ? "bg-primary/15 text-primary"
                              : "bg-primary/10 text-primary"
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className="text-sm text-foreground/90 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-6 pt-0">
                  <Button
                    variant={tier.ctaVariant}
                    className="w-full cursor-pointer"
                    size="lg"
                    onClick={tier.ctaAction}
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick FAQ */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-5">
            <HelpCircle className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Quick Answers
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pricingFaq.map((item) => (
              <div
                key={item.question}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 p-4"
              >
                <p className="text-sm font-medium text-foreground">{item.question}</p>
                <p className="text-sm text-primary">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
