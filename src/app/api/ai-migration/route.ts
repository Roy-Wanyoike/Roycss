import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are RoyCSS AI Migration tool. Convert CSS from other frameworks/conventions to RoyCSS-compatible CSS.

Rules:
1. Return ONLY valid CSS code — no markdown fences, no explanations.
2. Every class MUST be prefixed "roycss-" and every keyframe "roy-".
3. Convert ALL hex/rgba/hsl colors to OKLCH using color-mix(in oklch, ...).
4. Convert physical properties to logical (margin-left → margin-inline-start, etc.).
5. Add @media (prefers-reduced-motion: reduce) block for any animated effect.
6. Preserve the visual intent — same look, modernized implementation.
7. Keep it concise.

Mapping guide:
- margin-left → margin-inline-start
- margin-right → margin-inline-end
- padding-left → padding-inline-start
- padding-right → padding-inline-end
- border-left → border-inline-start
- border-right → border-inline-end
- left: → inset-inline-start:
- right: → inset-inline-end:
- text-align: left → text-align: start
- text-align: right → text-align: end
- #10b981 (emerald) → oklch(0.696 0.149 162.48)
- #3b82f6 (blue) → oklch(0.546 0.245 262.88)
- #8b5cf6 (violet) → oklch(0.566 0.245 278.69)
- #ef4444 (red) → oklch(0.637 0.237 25.77)
- #f59e0b (amber) → oklch(0.769 0.188 70.08)
- #fff → oklch(1 0 0)
- #000 → oklch(0 0 0)
- rgba(R,G,B,A) → color-mix(in oklch, OKLCH (A*100)%, transparent)`;

export async function POST(req: NextRequest) {
  try {
    const { css, framework } = await req.json();
    if (!css || typeof css !== "string") {
      return NextResponse.json({ error: "CSS is required" }, { status: 400 });
    }
    if (css.length > 10000) {
      return NextResponse.json({ error: "CSS too long (max 10000 chars)" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const userPrompt = `Convert this ${framework || "unknown"} CSS to RoyCSS-compatible CSS (OKLCH, logical properties, prefers-reduced-motion):\n\n${css}`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      thinking: { type: "disabled" },
    });

    const converted = response.choices?.[0]?.message?.content?.trim() ?? "";
    if (!converted) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    return NextResponse.json({ css: converted, framework: framework || "unknown" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[AI Migration] Error:", message);
    return NextResponse.json({ error: "Migration failed. Please try again." }, { status: 500 });
  }
}
