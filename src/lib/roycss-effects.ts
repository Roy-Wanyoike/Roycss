import type { CSSEffect } from "./roycss-types";
import { effectsBatch1 } from "./effects-batch-1";
import { effectsBatch2 } from "./effects-batch-2";
import { effectsBatch3 } from "./effects-batch-3";
import { effectsBatch4 } from "./effects-batch-4";
import { effectsBatch5 } from "./effects-batch-5";
import { effectsBatch6 } from "./effects-batch-6";
import { effectsBatch7 } from "./effects-batch-7";
import { effectsBatch8 } from "./effects-batch-8";
import { effectsBatch9 } from "./effects-batch-9";
import { effectsBatch10 } from "./effects-batch-10";
import { effectsBatch11 } from "./effects-batch-11";
import { effectsBatch12 } from "./effects-batch-12";
import { effectsBatch13 } from "./effects-batch-13";
import { effectsBatch14 } from "./effects-batch-14";
import { effectsBatch15 } from "./effects-batch-15";
import { effectsBatch16 } from "./effects-batch-16";
import { effectsBatch17 } from "./effects-batch-17";

// Re-export types and metadata
export type { CSSEffect, EffectCategory, PreviewType } from "./roycss-types";
export { categoryMeta, categoryOrder } from "./roycss-types";

// Combine all batches into the master effects array
export const effects: CSSEffect[] = [
  ...effectsBatch1,
  ...effectsBatch2,
  ...effectsBatch3,
  ...effectsBatch4,
  ...effectsBatch5,
  ...effectsBatch6,
  ...effectsBatch7,
  ...effectsBatch8,
  ...effectsBatch9,
  ...effectsBatch10,
  ...effectsBatch11,
  ...effectsBatch12,
  ...effectsBatch13,
  ...effectsBatch14,
  ...effectsBatch15,
  ...effectsBatch16,
  ...effectsBatch17,
];

// Generate combined CSS string for injection (avoids FOUC by rendering server-side)
export const allEffectCSS: string = effects
  .map((e) => e.cssCode)
  .join("\n\n");
