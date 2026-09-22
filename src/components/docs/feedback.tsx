"use client";

/**
 * DocsFeedback — per-doc-page "Was this page helpful?" widget
 * (issue #127 / PF-014 acceptance #5).
 *
 * Two-step flow: verdict (👍/👎) → optional comment → submit. The submit
 * logic lives in `src/lib/docs-feedback.ts` (unit-tested with a mocked
 * fetcher). Errors render inline with role=alert; success shows a
 * thank-you state with a reset escape hatch. Submit is guarded against
 * double-firing while pending.
 */

import { useState, useId } from "react";
import { ThumbsUp, ThumbsDown, Send, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  submitDocsFeedback,
  validateDocsFeedback,
  DOCS_FEEDBACK_COMMENT_MAX,
} from "@/lib/docs-feedback";

type Phase = "idle" | "comment" | "submitting" | "done";

export function DocsFeedback({ slug }: { slug: string }) {
  const reactId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string>("");

  const pick = (verdict: boolean) => {
    setHelpful(verdict);
    setError(null);
    setPhase("comment");
  };

  const submit = async () => {
    if (helpful == null || phase === "submitting") return;
    const fields = { slug, helpful, comment: comment || undefined };
    const problems = validateDocsFeedback(fields);
    if (problems.comment || problems.slug) {
      setError(problems.comment ?? problems.slug ?? "Invalid feedback.");
      return;
    }
    setPhase("submitting");
    setError(null);
    try {
      const result = await submitDocsFeedback(fields);
      setThanks(result.message);
      setPhase("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send your feedback.",
      );
      setPhase("comment");
    }
  };

  const reset = () => {
    setPhase("idle");
    setHelpful(null);
    setComment("");
    setError(null);
    setThanks("");
  };

  // The comment panel shows in both the editing and submitting phases so
  // the form stays mounted (with its pending state) while POSTing.
  const showCommentPanel = phase === "comment" || phase === "submitting";

  if (phase === "done") {
    return (
      <div
        className="mt-10 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4"
        role="status"
      >
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {thanks}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3" />
          Send more feedback
        </button>
      </div>
    );
  }

  return (
    <div
      className="mt-10 rounded-2xl border border-border bg-card/50 px-5 py-4"
      aria-labelledby={`${reactId}-label`}
    >
      <p
        id={`${reactId}-label`}
        className="text-sm font-medium text-foreground"
      >
        Was this page helpful?
      </p>

      {phase === "idle" && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pick(true)}
            className="cursor-pointer gap-1.5 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
            aria-label="Yes, this page was helpful"
          >
            <ThumbsUp className="size-3.5" />
            Yes
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pick(false)}
            className="cursor-pointer gap-1.5 hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400"
            aria-label="No, this page was not helpful"
          >
            <ThumbsDown className="size-3.5" />
            No
          </Button>
        </div>
      )}

      {showCommentPanel && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            {helpful
              ? "Great! Anything you'd like to add?"
              : "Sorry to hear that — what should we improve?"}
          </p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional — tell us more…"
            maxLength={DOCS_FEEDBACK_COMMENT_MAX}
            rows={3}
            className="min-h-[72px] resize-y text-sm"
            aria-label="Feedback comment (optional)"
            aria-invalid={!!error}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {comment.length}/{DOCS_FEEDBACK_COMMENT_MAX}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                className="cursor-pointer text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={submit}
                disabled={phase === "submitting"}
                className="cursor-pointer gap-1.5"
              >
                {phase === "submitting" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className={cn("mt-2 text-xs text-rose-600 dark:text-rose-400")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
