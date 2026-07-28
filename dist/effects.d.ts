// RoyCSS type declarations — auto-generated
export interface CSSEffect {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  previewType: string;
  previewText: string | null;
  childCount: number | null;
}

export declare const effects: CSSEffect[];
export declare const categories: string[];
export declare const categoryMeta: Record<string, { label: string; description: string }>;
export default effects;
