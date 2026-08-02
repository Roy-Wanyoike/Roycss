"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Eye, Copy, Star, Heart, Clock, TrendingUp, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { getTopRatedEffects } from "@/components/roycss/star-rating";
import { getRecentEffectIds } from "@/components/roycss/recent-effects-sheet";

/**
 * UserAnalyticsDashboard — shows the user's personal interaction stats:
 * - Total effects viewed (recent history)
 * - Total CSS copied (clipboard history)
 * - Top rated effects (from star ratings)
 * - Favorites count
 * - Most viewed categories
 * - Activity timeline
 *
 * All data comes from localStorage — no server, no tracking, fully private.
 */

interface AnalyticsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favoritesCount: number;
  onSelectEffect: (effect: CSSEffect) => void;
}

export function UserAnalyticsDashboard({ open, onOpenChange, favoritesCount, onSelectEffect }: AnalyticsDashboardProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [topRated, setTopRated] = useState<{ id: string; rating: number }[]>([]);
  const [copyHistory, setCopyHistory] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      setRecentIds(getRecentEffectIds());
      setTopRated(getTopRatedEffects());
      try {
        const ch = JSON.parse(localStorage.getItem("roycss-clipboard-history") || "[]");
        setCopyHistory(ch.length);
      } catch { setCopyHistory(0); }
    };
    update();
    window.addEventListener("roycss-recent-change", update);
    window.addEventListener("roycss-clipboard-change", update);
    window.addEventListener("roycss-ratings-change", update);
    return () => {
      window.removeEventListener("roycss-recent-change", update);
      window.removeEventListener("roycss-clipboard-change", update);
      window.removeEventListener("roycss-ratings-change", update);
    };
  }, []);

  const stats = useMemo(() => {
    const viewed = recentIds.length;
    const rated = topRated.length;
    const avgRating = rated > 0 ? (topRated.reduce((s, r) => s + r.rating, 0) / rated).toFixed(1) : "—";

    // Most viewed categories
    const catCounts: Record<string, number> = {};
    for (const id of recentIds) {
      const effect = effects.find(e => e.id === id);
      if (effect) catCounts[effect.category] = (catCounts[effect.category] || 0) + 1;
    }
    const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { viewed, copied: copyHistory, rated, avgRating, favorites: favoritesCount, topCats };
  }, [recentIds, topRated, copyHistory, favoritesCount]);

  const topRatedEffects = useMemo(() =>
    topRated.slice(0, 5).map(r => ({ ...r, effect: effects.find(e => e.id === r.id) })).filter(r => r.effect),
  [topRated]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <BarChart3 className="size-5 text-primary" />
            Your Activity
          </SheetTitle>
          <SheetDescription>
            Personal stats from your RoyCSS usage. All data is stored locally — no tracking, no server.
          </SheetDescription>
        </SheetHeader>

        <div className="p-5 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatCard icon={Eye} label="Viewed" value={stats.viewed} color="text-sky-500 bg-sky-500/10" />
            <StatCard icon={Copy} label="Copied" value={stats.copied} color="text-emerald-500 bg-emerald-500/10" />
            <StatCard icon={Star} label="Rated" value={stats.rated} color="text-amber-500 bg-amber-500/10" />
            <StatCard icon={Heart} label="Favorites" value={stats.favorites} color="text-rose-500 bg-rose-500/10" />
            <StatCard icon={TrendingUp} label="Avg Rating" value={stats.avgRating} color="text-violet-500 bg-violet-500/10" />
            <StatCard icon={Clock} label="Explore Rate" value={`${stats.viewed > 0 ? Math.round(stats.viewed / 1569 * 100 * 10) / 10 : 0}%`} color="text-primary bg-primary/10" />
          </div>

          {/* Top rated effects */}
          {topRatedEffects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Top Rated</p>
              <div className="space-y-1.5">
                {topRatedEffects.map(({ id, rating, effect }) => (
                  <button
                    key={id}
                    onClick={() => { onSelectEffect(effect!); onOpenChange(false); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-center size-8 rounded bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                      <div className="scale-[0.35] origin-center"><LivePreview effect={effect!} /></div>
                    </div>
                    <span className="text-xs font-medium text-foreground truncate flex-1">{effect!.name}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-2.5 ${i < rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top categories */}
          {stats.topCats.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Most Explored Categories</p>
              <div className="space-y-1.5">
                {stats.topCats.map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-xs text-foreground capitalize flex-1">{cat.replace("-", " ")}</span>
                    <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / stats.topCats[0][1]) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              🔒 All activity data is stored in your browser&apos;s localStorage. Nothing is sent to a server.
              Clear your browser data to reset these stats.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border/50">
      <div className={`flex items-center justify-center size-8 rounded-lg ${color} mb-2`}>
        <Icon className="size-4" />
      </div>
      <p className="font-display text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}
