"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Pricing section — honest pre-launch mode (audit UI/UX F-09).
 *
 * Pro/Team/Enterprise are NOT purchasable today: there is no billing.
 * Instead of the old fake "trial is coming" toasts, each paid-tier CTA
 * opens a waitlist dialog that captures an email and POSTs it to the
 * existing `/api/contact` endpoint (the only backend endpoint that
 * persists an email today — ContactMessage rows in the app database,
 * indexed by email). Success and failure states are real: no toast lies.
 */

/* ─── Pricing tier data ─────────────────────────────────────── */
interface PricingTier {
  name: "Free" | "Pro" | "Team" | "Enterprise";
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
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
    cta: "Join Pro Waitlist",
    ctaVariant: "default",
    popular: true,
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
    cta: "Join Team Waitlist",
    ctaVariant: "default",
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
  },
];

/* ─── Waitlist dialog copy per tier ─────────────────────────── */
type WaitlistTier = "Pro" | "Team" | "Enterprise";

const WAITLIST_COPY: Record<WaitlistTier, { title: string; description: string }> = {
  Pro: {
    title: "Pro is launching soon — join the waitlist",
    description:
      "Pro isn't available for purchase yet; everything on the site is free today. Leave your email and we'll notify you the moment Pro opens up.",
  },
  Team: {
    title: "Team is launching soon — join the waitlist",
    description:
      "Team plans aren't available for purchase yet. Leave your email and we'll reach out when Team trials open.",
  },
  Enterprise: {
    title: "Enterprise is coming — talk to us at launch",
    description:
      "Enterprise plans aren't live yet. Leave your email and we'll get in touch when they launch to talk about governance, SSO, and SLAs.",
  },
};

type WaitlistStatus = "idle" | "submitting" | "success" | "error";

/* ─── Waitlist dialog ───────────────────────────────────────── */
function WaitlistDialog({
  tier,
  onOpenChange,
}: {
  tier: WaitlistTier | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const open = tier !== null;
  const copy = tier ? WAITLIST_COPY[tier] : null;

  // Fresh form on every (re)open: if the tier prop changed since the
  // last render, reset the form state before painting (React's
  // documented "adjust state when a prop changes" pattern — no effect,
  // no stale success state if the dialog is reopened).
  const [prevTier, setPrevTier] = useState<WaitlistTier | null>(null);
  if (tier !== prevTier) {
    setPrevTier(tier);
    setEmail("");
    setStatus("idle");
    setErrorMsg("");
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tier || status === "submitting") return;
      setStatus("submitting");
      setErrorMsg("");
      try {
        const trimmed = email.trim();
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmed.split("@")[0] || "Waitlist signup",
            email: trimmed,
            subject: `${tier} Plan Waitlist`,
            message: `Joined the ${tier} plan waitlist from the pricing section on roycss.com.`,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(
            data.error || "Couldn't join the waitlist right now. Please try again.",
          );
        }
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    },
    [email, tier, status],
  );

  if (!copy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {status === "success" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="size-7 text-emerald-500" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              You&apos;re on the list
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              We&apos;ll email{" "}
              <span className="font-medium text-foreground">{email.trim()}</span>{" "}
              the moment {tier} becomes available. No spam — just the launch
              announcement.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-6 cursor-pointer"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{copy.title}</DialogTitle>
              <DialogDescription className="leading-relaxed">
                {copy.description}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waitlist-email">Email</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  required
                  maxLength={160}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "submitting"}
                  className="h-11"
                  autoComplete="email"
                />
              </div>

              {status === "error" && errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <DialogFooter className="flex-col gap-2">
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full cursor-pointer"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>Notify me at launch</>
                  )}
                </Button>
                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                  We&apos;ll only use your email to tell you when {tier}{" "}
                  launches — see our{" "}
                  <Link
                    href="/privacy"
                    className="text-primary underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/terms"
                    className="text-primary underline underline-offset-2"
                  >
                    Terms
                  </Link>
                  .
                </p>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Quick FAQ ─────────────────────────────────────────────── */
const pricingFaq: Array<{ question: string; answer: string }> = [
  { question: "Can I change plans anytime?", answer: "Yes." },
  { question: "Can I cancel anytime?", answer: "Yes." },
  { question: "Do you offer student discounts?", answer: "Yes, 50% off Pro." },
  { question: "Do you offer open-source discounts?", answer: "Yes, free Pro for qualifying projects." },
];

/* ─── Pricing Section ───────────────────────────────────────── */
export function PricingSection() {
  const [waitlistTier, setWaitlistTier] = useState<WaitlistTier | null>(null);

  const handleCta = (tier: PricingTier) => {
    if (tier.name === "Free") {
      const el = document.querySelector("#get-started");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setWaitlistTier(tier.name);
  };

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
          <p className="mx-auto mt-3 max-w-md rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Paid plans aren&apos;t available for purchase yet — every effect
            and every current feature is free today. The tiers below show our
            planned launch pricing.
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
                    onClick={() => handleCta(tier)}
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
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Answers apply to the paid tiers at launch. Questions before then?{" "}
            <Link href="/terms" className="text-primary underline underline-offset-2">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-2">
              Privacy
            </Link>
          </p>
        </div>
      </div>

      {/* Pre-launch waitlist dialog (replaces the old fake toasts) */}
      <WaitlistDialog tier={waitlistTier} onOpenChange={(o) => !o && setWaitlistTier(null)} />
    </section>
  );
}
