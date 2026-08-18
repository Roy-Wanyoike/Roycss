import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are RoyCSS AI, an expert CSS assistant for the RoyCSS effects library.
You generate production-ready CSS effects based on user prompts.

Rules:
1. Return ONLY valid CSS code — no markdown fences, no explanations before/after.
2. Every class MUST be prefixed with "roycss-" and every keyframe with "roy-".
3. Use OKLCH colors via color-mix(in oklch, ...) — NO hex or rgba.
4. Use CSS logical properties (margin-inline-start, not margin-left).
5. Include prefers-reduced-motion support.
6. The CSS must be self-contained: class + keyframes + any ::before/::after in one block.
7. Keep it concise — under 30 lines of CSS.
8. End with a brief one-line comment describing the effect.

Example output:
/* A pulsing glow effect */
.roycss-ai-glow {
  animation: roy-ai-glow 2s ease-in-out infinite;
}
@keyframes roy-ai-glow {
  0%, 100% { box-shadow: 0 0 5px color-mix(in oklch, oklch(0.6 0.2 162) 30%, transparent); }
  50% { box-shadow: 0 0 20px color-mix(in oklch, oklch(0.6 0.2 162) 60%, transparent); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-ai-glow { animation: none; }
}`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: "Prompt too long (max 500 chars)" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a CSS effect for: "${prompt}"` },
      ],
      stream: false,
      thinking: { type: "disabled" },
    });

    const css = response.choices?.[0]?.message?.content?.trim() ?? "";
    if (!css) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    return NextResponse.json({ css, prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[AI Playground] Error:", message);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
