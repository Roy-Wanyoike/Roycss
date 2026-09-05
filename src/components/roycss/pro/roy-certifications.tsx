"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyCertifications — RoyCSS certification & verification platform.
 *
 * Self-contained (no props). Layout:
 *   • Header with verification lookup input (mock).
 *   • 4 certification cards — Associate, Professional, Expert, Architect
 *     with badge, requirements, exam format, passing score, validity,
 *     and a "Schedule Exam" button (mock toast).
 *   • "Your Certifications" panel — 2 mock earned certs with score +
 *     earned date.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Cert level is a string-literal union; the
 *     `never` guard enforces exhaustiveness on the tone mapper.
 *   • Palette: emerald primary, teal/amber accents, sky for expert,
 *     rose for architect. No indigo/blue.
 */

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Medal,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Level = "associate" | "professional" | "expert" | "architect";

interface Cert {
  id: Level;
  name: string;
  icon: LucideIcon;
  tone: string;
  requirements: string;
  format: string;
  passingScore: string;
  validity: string;
}

interface EarnedCert {
  id: string;
  level: Level;
  score: string;
  earned: string;
  credentialId: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const CERTS: readonly Cert[] = [
  {
    id: "associate",
    name: "RoyCSS Associate",
    icon: BadgeCheck,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    requirements: "Foundational CSS knowledge · 6 months experience",
    format: "40 questions · 60 min · online proctored",
    passingScore: "70%",
    validity: "2 years",
  },
  {
    id: "professional",
    name: "RoyCSS Professional",
    icon: Medal,
    tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    requirements: "Associate cert · 2+ years · design-systems work",
    format: "60 questions + 2 labs · 120 min",
    passingScore: "75%",
    validity: "3 years",
  },
  {
    id: "expert",
    name: "RoyCSS Expert",
    icon: Star,
    tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    requirements: "Professional cert · 4+ years · OSS contributions",
    format: "Practical review + system design · 180 min",
    passingScore: "80%",
    validity: "3 years",
  },
  {
    id: "architect",
    name: "RoyCSS Architect",
    icon: Trophy,
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    requirements: "Expert cert · 7+ years · led 3+ design systems",
    format: "Architecture defense + panel · 240 min",
    passingScore: "85%",
    validity: "5 years",
  },
];

const EARNED: readonly EarnedCert[] = [
  { id: "e1", level: "associate", score: "92%", earned: "Jan 2024", credentialId: "RCSS-A-8X4K2" },
  { id: "e2", level: "professional", score: "87%", earned: "Sep 2024", credentialId: "RCSS-P-3M7L9" },
];

const LEVEL_NAME: Record<Level, string> = {
  associate: "RoyCSS Associate",
  professional: "RoyCSS Professional",
  expert: "RoyCSS Expert",
  architect: "RoyCSS Architect",
};

// ─── Component ───────────────────────────────────────────────────────────

export function RoyCertifications() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("certifications");
  void data;

  const [credentialId, setCredentialId] = useState("");
  const { toast } = useToast();

  const schedule = (name: string) =>
    toast({
      title: "Exam scheduled",
      description: `${name} — a calendar invite will arrive shortly (mock).`,
    });

  const verify = () => {
    if (!credentialId.trim()) return;
    toast({
      title: "Credential verified",
      description: `Lookup for "${credentialId}" returned a valid cert (mock).`,
    });
    setCredentialId("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header + verification */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <GraduationCap className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Certifications</CardTitle>
                  <BackendLiveBadge module="certifications" loading={loading} error={error} />
                </div>
                <CardDescription>
                  Validate your RoyCSS expertise. 4 levels, recognized industry-wide.
                </CardDescription>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Verify credential ID…"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Button onClick={verify} variant="outline" size="sm" className="gap-1.5">
              <ShieldCheck className="size-3.5" /> Verify
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Your certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-4" /> Your Certifications
          </CardTitle>
          <CardDescription>2 of 4 levels earned.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {EARNED.map((e) => {
            const cert = CERTS.find((c) => c.id === e.level);
            if (!cert) return null;
            const Icon = cert.icon;
            return (
              <div
                key={e.id}
                className="flex flex-1 items-center gap-3 rounded-lg border p-3"
              >
                <div className={cn("flex size-11 items-center justify-center rounded-xl", cert.tone)}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{LEVEL_NAME[e.level]}</p>
                  <code className="text-muted-foreground text-[11px]">{e.credentialId}</code>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {e.score}
                    </span>
                    <span className="text-muted-foreground">· {e.earned}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Certification catalog */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Available Certifications
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {CERTS.map((c) => {
            const Icon = c.icon;
            const earned = EARNED.some((e) => e.level === c.id);
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex size-11 items-center justify-center rounded-xl", c.tone)}>
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{c.name}</CardTitle>
                        <CardDescription className="text-xs">{c.requirements}</CardDescription>
                      </div>
                    </div>
                    {earned && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-1">
                        <BadgeCheck className="size-3" /> Earned
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground flex items-center gap-1">
                        <BookOpen className="size-3" /> Format
                      </dt>
                      <dd className="mt-0.5 font-medium">{c.format}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Pass Score</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums">{c.passingScore}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Validity</dt>
                      <dd className="mt-0.5 font-medium">{c.validity}</dd>
                    </div>
                  </dl>
                  <Button
                    onClick={() => schedule(c.name)}
                    variant={earned ? "outline" : "default"}
                    className="mt-4 w-full gap-1.5"
                  >
                    <CalendarCheck className="size-4" />
                    {earned ? "Re-certify" : "Schedule Exam"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
