"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  ArrowRight,
  Check,
  Crown,
  Layers,
  Star,
  Heart,
  Award,
  Github,
  CreditCard,
  Info,
} from "lucide-react";
import { ScrollReveal } from "@/components/roycss/motion-primitives";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ═══════════════════════════════════════════════════════════════
   Sponsorship Tiers
   ─────────────────────────────────────────────────────────────
   Founder             — Special tier for the company that built RoyCSS
   Technology Partner  — $10,000+ suggested
   Platinum            — $3,000+ suggested
   Gold                — Any amount

   Amounts are SUGGESTIONS (hints), not compulsory.
   ═══════════════════════════════════════════════════════════════ */

export type SponsorTier = "founder" | "technology-partner" | "platinum" | "gold";

interface TierMeta {
  id: SponsorTier;
  label: string;
  suggestedAmount: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  glowBorder: string;
  glowShadow: string;
  isRecognition?: boolean;
  description: string;
}

export const TIER_META: Record<SponsorTier, TierMeta> = {
  founder: {
    id: "founder",
    label: "Founder",
    suggestedAmount: "Creator",
    icon: Award,
    color: "text-emerald-500",
    bg: "bg-emerald-500/15",
    glowBorder: "border-emerald-500/60",
    glowShadow:
      "0 0 24px color-mix(in oklch, oklch(0.7 0.15 162) 50%, transparent), 0 0 48px color-mix(in oklch, oklch(0.7 0.15 162) 25%, transparent)",
    isRecognition: true,
    description: "The company that built and maintains RoyCSS",
  },
  "technology-partner": {
    id: "technology-partner",
    label: "Technology Partner",
    suggestedAmount: "$10,000+ suggested",
    icon: Layers,
    color: "text-cyan-500",
    bg: "bg-cyan-500/15",
    glowBorder: "border-cyan-500/50",
    glowShadow:
      "0 0 20px color-mix(in oklch, oklch(0.71 0.15 196) 40%, transparent), 0 0 40px color-mix(in oklch, oklch(0.71 0.15 196) 20%, transparent)",
    description: "Framework integrations and co-marketing",
  },
  platinum: {
    id: "platinum",
    label: "Platinum",
    suggestedAmount: "$3,000+ suggested",
    icon: Crown,
    color: "text-violet-500",
    bg: "bg-violet-500/15",
    glowBorder: "border-violet-500/50",
    glowShadow:
      "0 0 20px color-mix(in oklch, oklch(0.62 0.19 295) 40%, transparent), 0 0 40px color-mix(in oklch, oklch(0.62 0.19 295) 20%, transparent)",
    description: "Hero placement and direct engineering support",
  },
  gold: {
    id: "gold",
    label: "Gold",
    suggestedAmount: "Any amount",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    glowBorder: "border-amber-500/50",
    glowShadow:
      "0 0 16px color-mix(in oklch, oklch(0.75 0.15 75) 35%, transparent), 0 0 32px color-mix(in oklch, oklch(0.75 0.15 75) 15%, transparent)",
    description: "Featured placement and community recognition",
  },
};

export function getTierForCompany(company: Company): SponsorTier {
  if (company.tierOverride) return company.tierOverride;
  return getTierForAmount(company.amount ?? 0);
}

export function getTierForAmount(amount: number): SponsorTier {
  if (amount >= 10000) return "technology-partner";
  if (amount >= 3000) return "platinum";
  return "gold";
}

/* ═══════════════════════════════════════════════════════════════
   Company data
   ═══════════════════════════════════════════════════════════════ */

export interface Company {
  name: string;
  tagline: string;
  href: string;
  amount?: number;
  tierOverride?: SponsorTier;
}

export const COMPANIES: Company[] = [
  {
    name: "Youngshark Technologies",
    tagline: "Empowering Innovation, Connecting Futures — the team behind RoyCSS",
    href: "https://www.linkedin.com/company/youngshark-technologies",
    tierOverride: "founder",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Tier Badge
   ═══════════════════════════════════════════════════════════════ */

function TierBadge({ tier, size = "sm" }: { tier: SponsorTier; size?: "sm" | "md" }) {
  const meta = TIER_META[tier];
  const Icon = meta.icon;
  const sizeClasses = size === "md" ? "px-2.5 py-1 text-xs gap-1" : "px-1.5 py-0.5 text-[10px] gap-0.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${meta.bg} ${meta.color} ${sizeClasses} whitespace-nowrap`}
    >
      <Check className={size === "md" ? "size-3" : "size-2.5"} />
      <Icon className={size === "md" ? "size-3" : "size-2.5"} />
      {meta.label}
    </span>
  );
}

export { TierBadge };

/* ═══════════════════════════════════════════════════════════════
   Company Card — with unique glow + tier badge
   ═══════════════════════════════════════════════════════════════ */

function CompanyCard({ company }: { company: Company }) {
  const tier = getTierForCompany(company);
  const meta = TIER_META[tier];
  const isFounder = tier === "founder";

  return (
    <a
      href={company.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex items-center gap-3 rounded-xl border bg-card/50 px-5 py-3 transition-all hover:bg-card ${meta.glowBorder}`}
      style={{ boxShadow: meta.glowShadow }}
      aria-label={`${company.name} — ${company.tagline} — ${meta.label}`}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: meta.glowShadow }}
      />
      {isFounder && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: meta.glowShadow }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className={`flex items-center justify-center size-10 rounded-lg ${meta.bg} ${meta.color} shrink-0 group-hover:scale-110 transition-transform`}>
        <Building2 className="size-5" />
      </div>
      <div className="text-left min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-bold text-sm text-foreground leading-tight">
            {company.name}
          </p>
          <TierBadge tier={tier} />
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
          {company.tagline}
        </p>
      </div>
      <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sponsor Modal — multiple payment methods
   ═══════════════════════════════════════════════════════════════ */

const SPONSOR_AMOUNTS = [25, 50, 100, 500, 1000] as const;
const PAYMENT_METHODS = [
  {
    id: "github",
    label: "GitHub Sponsors",
    description: "One-time or monthly via GitHub",
    icon: Github,
    href: "https://github.com/sponsors/Roy-Wanyoike",
    available: true,
  },
  {
    id: "stripe",
    label: "Stripe",
    description: "Credit card — coming soon",
    icon: CreditCard,
    href: null,
    available: false,
  },
] as const;

interface SponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SponsorModal({ open, onOpenChange }: SponsorModalProps) {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("monthly");

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;
  const tier = getTierForAmount(finalAmount);
  const tierMeta = TIER_META[tier];

  const handleGithubSponsor = useCallback(() => {
    window.open(
      `https://github.com/sponsors/Roy-Wanyoike?frequency=${frequency}&amount=${finalAmount}`,
      "_blank",
      "noopener,noreferrer",
    );
    onOpenChange(false);
  }, [frequency, finalAmount, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Heart className="size-5 text-primary" />
            Sponsor RoyCSS
          </DialogTitle>
          <DialogDescription>
            Support the development of RoyCSS. Any amount is appreciated — tiers are
            recognition labels, not requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Frequency toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <button
              onClick={() => setFrequency("one-time")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                frequency === "one-time" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              One-time
            </button>
            <button
              onClick={() => setFrequency("monthly")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                frequency === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Amount selection */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount {frequency === "monthly" ? "/ month" : ""}
              </Label>
              <Info className="size-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground italic">suggested</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {SPONSOR_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    !customAmount && amount === amt
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">$</span>
              <Input
                type="number"
                min={1}
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-7 h-10"
              />
            </div>
          </div>

          {/* Tier preview */}
          {finalAmount > 0 && (
            <div
              className={`flex items-center gap-3 rounded-lg border p-3 ${tierMeta.glowBorder} ${tierMeta.bg}`}
              style={{ boxShadow: tierMeta.glowShadow }}
            >
              <tierMeta.icon className={`size-5 ${tierMeta.color} shrink-0`} />
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${tierMeta.color}`}>
                  {tierMeta.label} tier
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {tierMeta.description}
                </p>
              </div>
            </div>
          )}

          {/* Payment methods */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Payment Method
            </Label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={method.available && method.id === "github" ? handleGithubSponsor : undefined}
                    disabled={!method.available}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      method.available
                        ? "border-border hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
                        : "border-dashed border-border/50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className={`flex items-center justify-center size-10 rounded-lg ${method.available ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground"}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {method.label}
                        {!method.available && (
                          <span className="ml-2 text-[10px] text-muted-foreground">(coming soon)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {method.description}
                      </p>
                    </div>
                    {method.available && <ArrowRight className="size-4 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <Info className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tier amounts are suggestions — not requirements. You&apos;ll be recognized at the
              tier matching your contribution. All sponsors get listed in the carousel and on the
              homepage.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Featured Companies — logo strip on the hero page
   ═══════════════════════════════════════════════════════════════ */

export function FeaturedCompanies() {
  const [sponsorOpen, setSponsorOpen] = useState(false);

  return (
    <>
      <section
        className="py-10 border-y border-border/40 bg-card/20"
        aria-label="Featured companies"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
              Trusted by teams building with RoyCSS
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {COMPANIES.map((company) => (
                <CompanyCard key={company.name} company={company} />
              ))}

              {/* Sponsor CTA card */}
              <button
                onClick={() => setSponsorOpen(true)}
                className="group flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-3 hover:bg-primary/10 transition-all cursor-pointer"
                aria-label="Become a sponsor"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-primary/15 text-primary shrink-0">
                  <Heart className="size-5" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-sm text-foreground leading-tight">
                    Your company here
                  </p>
                  <p className="text-[11px] text-primary leading-tight mt-0.5">
                    Sponsor RoyCSS →
                  </p>
                </div>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SponsorModal open={sponsorOpen} onOpenChange={setSponsorOpen} />
    </>
  );
}

export { SponsorModal };
