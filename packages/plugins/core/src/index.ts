/**
 * @roycss/plugin-core — shared scan/extract engine for first-party RoyCSS
 * build plugins (`@roycss/plugin-vite`, `@roycss/plugin-next`).
 *
 * Public surface:
 *   • scanner    — `scanClasses` / `scanSources` / `isRoyCssClass`
 *   • extractor  — `extractStylesheet` (+ `ExtractOptions` / `ExtractResult`)
 *   • parser     — `parseStylesheet` / `isBalancedCss` (+ `CssNode` types)
 *   • pipeline   — `createRoyCssPipeline` (used-class registry + `@import`
 *                 rewriting, PostCSS-style string pipeline)
 *   • resolve    — stylesheet loading/resolution + source-tree walking
 */

export {
  scanClasses,
  scanSources,
  isRoyCssClass,
} from "./scanner";

export {
  extractStylesheet,
  isBalancedCss,
  type ExtractOptions,
  type ExtractResult,
} from "./extractor";

export {
  parseStylesheet,
  isBalancedCss as isBalancedStylesheet,
  type CssNode,
  type CssAtRuleNode,
  type CssCommentNode,
  type CssGroupNode,
  type CssKeyframesNode,
  type CssPropertyNode,
  type CssRuleNode,
  type CssStatementNode,
} from "./css-parse";

export {
  createRoyCssPipeline,
  isRoyCssImportUrl,
  parseImportLayer,
  type RoyCssPipeline,
  type RoyCssPipelineOptions,
} from "./pipeline";

export {
  collectSourceFiles,
  defaultStylesheetCandidates,
  loadStylesheet,
  readSourceFiles,
  resolveStylesheet,
  DEFAULT_SOURCE_EXTENSIONS,
  DEFAULT_IGNORE_DIRS,
  type SourceWalkOptions,
} from "./resolve";
