import type { CSSEffect } from "./roycss-types";
import { effectsBatch1 } from "./effects-batch-1";
import { effectsBatch2 } from "./effects-batch-2";
import { effectsBatch3 } from "./effects-batch-3";
import { effectsBatch4 } from "./effects-batch-4";

// Re-export types and metadata
export type { CSSEffect, EffectCategory, PreviewType } from "./roycss-types";
export { categoryMeta, categoryOrder } from "./roycss-types";

// Combine all batches into the master effects array
export const effects: CSSEffect[] = [
  ...effectsBatch1,
  ...effectsBatch2,
  ...effectsBatch3,
  ...effectsBatch4,
];

// Generate combined CSS string for injection (avoids FOUC by rendering server-side)
export const allEffectCSS: string = effects
  .map((e) => e.cssCode)
  .join("\n\n");
