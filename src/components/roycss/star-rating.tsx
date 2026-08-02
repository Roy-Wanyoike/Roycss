"use client";

import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";

const STORAGE_KEY = "roycss-ratings";

function getRatings(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function saveRating(effectId: string, rating: number) {
  const ratings = getRatings();
  if (rating === 0) delete ratings[effectId];
  else ratings[effectId] = rating;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  window.dispatchEvent(new CustomEvent("roycss-ratings-change"));
}

/** Get the user's rating for an effect (0 = unrated) */
export function getUserRating(effectId: string): number {
  return getRatings()[effectId] || 0;
}

/** Get all rated effect IDs sorted by rating (highest first) */
export function getTopRatedEffects(): { id: string; rating: number }[] {
  const ratings = getRatings();
  return Object.entries(ratings)
    .map(([id, rating]) => ({ id, rating }))
    .sort((a, b) => b.rating - a.rating);
}

interface StarRatingProps {
  effectId: string;
  size?: "sm" | "md";
}

/**
 * StarRating — interactive 5-star rating for any effect.
 * Stored in localStorage. Click a star to rate, click again to clear.
 */
export function StarRating({ effectId, size = "sm" }: StarRatingProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    setRating(getUserRating(effectId));
  }, [effectId]);

  const handleRate = useCallback((star: number) => {
    const newRating = star === rating ? 0 : star; // Toggle off if same
    setRating(newRating);
    saveRating(effectId, newRating);
  }, [effectId, rating]);

  const starSize = size === "sm" ? "size-3.5" : "size-5";

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label={`Rate this effect`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); handleRate(star); }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`transition-all cursor-pointer ${starSize} ${
            (hover || rating) >= star
              ? "text-amber-500 fill-amber-500"
              : "text-muted-foreground/40 hover:text-amber-400"
          }`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          aria-checked={rating === star}
          role="radio"
          type="button"
        >
          <Star className="size-full" />
        </button>
      ))}
      {rating > 0 && (
        <span className="text-[10px] text-muted-foreground ml-1">{rating}/5</span>
      )}
    </div>
  );
}
