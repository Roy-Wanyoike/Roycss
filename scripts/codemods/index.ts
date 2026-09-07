/**
 * index.ts — codemod registry (PF-015, issue #95)
 *
 * Every codemod shipped by the migration library, in CLI listing order:
 * five inbound (Tailwind / Bootstrap / Animate.css / MUI / Chakra → RoyCSS),
 * two outbound (RoyCSS → plain CSS / Tailwind) and the report-only
 * V1 → V2 scaffold. `roycss migrate <id> <glob>` dispatches through this
 * registry; `bun scripts/codemods/<id>.ts` runs one directly.
 */

import type { CodemodDefinition } from "./lib/engine";

import fromTailwind from "./from-tailwind";
import fromBootstrap from "./from-bootstrap";
import fromAnimateCss from "./from-animate-css";
import fromMui from "./from-mui";
import fromChakra from "./from-chakra";
import toVanillaCss from "./to-vanilla-css";
import toTailwind from "./to-tailwind";
import v1ToV2 from "./v1-to-v2";

export const codemods: readonly CodemodDefinition[] = [
  fromTailwind,
  fromBootstrap,
  fromAnimateCss,
  fromMui,
  fromChakra,
  toVanillaCss,
  toTailwind,
  v1ToV2,
];

export const codemodIds: readonly string[] = codemods.map((c) => c.id);

/** Look up a codemod by its CLI id (`roycss migrate <id>`). */
export function getCodemod(id: string): CodemodDefinition | undefined {
  return codemods.find((c) => c.id === id);
}

export {
  fromTailwind,
  fromBootstrap,
  fromAnimateCss,
  fromMui,
  fromChakra,
  toVanillaCss,
  toTailwind,
  v1ToV2,
};
