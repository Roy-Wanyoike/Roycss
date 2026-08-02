"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { Badge } from "@/components/ui/badge";
import { getRecentEffectIds } from "@/components/roycss/recent-effects-sheet";
import { getTopRatedEffects } from "@/components/roycss/star-rating";

interface RecommendationEngineProps {
  onSelectEffect: (effect: CSSEffect) => void;
}

/**
 * EffectRecommendationEngine — suggests effects based on the user's
 * viewing history, ratings, and favorites. Uses a simple algorithm:
 * 1. Get user's recently viewed + top rated effects
 * 2. Find their most common categories and tags
 * 3. Recommend effects from those categories/tags that the user hasn't seen
 */
export function EffectRecommendationEngine({ onSelectEffect }: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<CSSEffect[]>([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const generateRecommendations = useCallback(() => {
    setLoading(true);

    // Collect user data
    const recentIds = getRecentEffectIds();
    const topRated = getTopRatedEffects();
    const userEffectIds = new Set([...recentIds, ...topRated.map(r => r.id)]);

    // Get user's effects
    const userEffects = effects.filter(e => userEffectIds.has(e.id));

    if (userEffects.length === 0) {
      // No history — recommend popular effects (most tags = most versatile)
      const popular = [...effects]
        .sort((a, b) => b.tags.length - a.tags.length)
        .slice(0, 5);
      setRecommendations(popular);
      setReason("Popular effects to get you started");
      setLoading(false);
      return;
    }

    // Count category preferences
    const catCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    for (const e of userEffects) {
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
      for (const tag of e.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    // Top categories and tags
    const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

    // Score unseen effects
    const scored = effects
      .filter(e => !userEffectIds.has(e.id))
      .map(e => {
        let score = 0;
        if (topCats.includes(e.category)) score += 3;
        for (const tag of e.tags) {
          if (topTags.includes(tag)) score += 1;
        }
        return { effect: e, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.effect);

    setRecommendations(scored);
    const catNames = topCats.map(c => c.replace("-", " ")).join(", ");
    setReason(catNames ? `Based on your interest in ${catNames}` : "Based on your activity");
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="size-4 text-primary" />
        <h3 className="font-display text-base font-semibold text-foreground">Recommended for You</h3>
      </div>

      {recommendations.length === 0 ? (
        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all cursor-pointer text-sm font-medium"
        >
          <Sparkles className="size-4" />
          {loading ? "Analyzing..." : "Get Personalized Recommendations"}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground italic">{reason}</p>
            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {recommendations.map((effect, i) => (
              <motion.button
                key={effect.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectEffect(effect)}
                className="group flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center size-12 rounded-lg bg-muted/40 border border-border/50 overflow-hidden">
                  <div className="scale-[0.5] origin-center"><LivePreview effect={effect} /></div>
                </div>
                <p className="text-xs font-medium text-foreground truncate w-full text-center">{effect.name}</p>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize">{effect.category.replace("-", " ")}</Badge>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
