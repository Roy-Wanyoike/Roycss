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
import { effectsBatch18 } from "./effects-batch-18";
import { effectsBatch19 } from "./effects-batch-19";
import { effectsBatch20 } from "./effects-batch-20";
import { effectsBatch21 } from "./effects-batch-21";
import { effectsBatch22 } from "./effects-batch-22";
import { effectsBatch23 } from "./effects-batch-23";
import { effectsBatch24 } from "./effects-batch-24";
import { effectsBatch25 } from "./effects-batch-25";
import { effectsBatch26 } from "./effects-batch-26";
import { effectsBatch27 } from "./effects-batch-27";
import { effectsBatch28 } from "./effects-batch-28";
import { effectsBatch29 } from "./effects-batch-29";
import { effectsBatch30 } from "./effects-batch-30";
import { effectsBatch31 } from "./effects-batch-31";
import { effectsBatch32 } from "./effects-batch-32";
import { effectsBatch33 } from "./effects-batch-33";
import { effectsBatch34 } from "./effects-batch-34";
import { effectsBatch35 } from "./effects-batch-35";
import { effectsBatch36 } from "./effects-batch-36";
import { effectsBatch37 } from "./effects-batch-37";
import { effectsBatch38 } from "./effects-batch-38";
import { effectsBatch39 } from "./effects-batch-39";
import { effectsBatch42 } from "./effects-batch-42";
import { effectsBatch43 } from "./effects-batch-43";
import { effectsBatch40 } from "./effects-batch-40";
import { effectsBatch41 } from "./effects-batch-41";

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
  ...effectsBatch18,
  ...effectsBatch19,
  ...effectsBatch20,
  ...effectsBatch21,
  ...effectsBatch22,
  ...effectsBatch23,
  ...effectsBatch24,
  ...effectsBatch25,
  ...effectsBatch26,
  ...effectsBatch27,
  ...effectsBatch28,
  ...effectsBatch29,
  ...effectsBatch30,
  ...effectsBatch31,
  ...effectsBatch32,
  ...effectsBatch33,
  ...effectsBatch34,
  ...effectsBatch35,
  ...effectsBatch36,
  ...effectsBatch37,
  ...effectsBatch38,
  ...effectsBatch39,
  ...effectsBatch42,
  ...effectsBatch43,
  ...effectsBatch40,
  ...effectsBatch41,
];

// Generate combined CSS string for injection (avoids FOUC by rendering server-side)
export const allEffectCSS: string = effects
  .map((e) => e.cssCode)
  .join("\n\n");
