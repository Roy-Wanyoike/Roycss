import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are RoyCSS CSS Doctor, an expert CSS diagnostician.
Analyze the user's CSS and return a JSON object with diagnostics and fixes.

Rules:
1. Return ONLY a valid JSON object — no markdown, no explanation outside JSON.
2. Check for: hex/rgba colors (should use OKLCH), physical properties (should use logical), missing prefers-reduced-motion, vendor prefix issues, specificity problems, accessibility concerns, performance issues.
3. For each issue, provide the exact fix.

JSON schema:
{
  "score": number (0-100, overall health score),
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "category": "color" | "logical-props" | "accessibility" | "performance" | "specificity" | "vendor" | "other",
      "line": number (approximate line number, 0 if unknown),
      "message": string (what's wrong),
      "fix": string (the corrected CSS snippet)
    }
  ],
  "summary": string (one-line overall assessment)
}

Example:
{"score":45,"issues":[{"severity":"warning","category":"color","line":3,"message":"Uses hex color #10b981 instead of OKLCH","fix":"background: oklch(0.696 0.149 162.48);"}],"summary":"Needs OKLCH color migration and reduced-motion support."}`;

export async function POST(req: NextRequest) {
  try {
    const { css } = await req.json();
    if (!css || typeof css !== "string") {
      return NextResponse.json({ error: "CSS is required" }, { status: 400 });
    }
    if (css.length > 10000) {
      return NextResponse.json({ error: "CSS too long (max 10000 chars)" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this CSS:\n\n${css}` },
      ],
      stream: false,
      thinking: { type: "disabled" },
    });

    const content = response.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    // Extract JSON from the response (in case AI wraps it)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CSS Doctor] Error:", message);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
