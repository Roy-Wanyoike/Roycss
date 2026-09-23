/**
 * Clipboard write with a legacy fallback (issue #216 item 5).
 *
 * `navigator.clipboard.writeText` is only available in secure contexts and
 * can reject when the permission is denied. Previously several copy buttons
 * swallowed that rejection (`catch { /* noop *\/ }`) — a silent no-op that
 * left users thinking the copy succeeded. This helper tries the async API
 * first, then falls back to the legacy `document.execCommand("copy")`
 * trick, and always reports success/failure so callers can surface honest
 * feedback (never a silent no-op).
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  // 1) Async Clipboard API (secure contexts).
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied, document not focused, insecure context — fall
    // through to the legacy path below.
  }

  // 2) Legacy fallback: hidden textarea + execCommand (deprecated but the
  // only programmatic path in insecure contexts / older WebViews).
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    // Keep it off-screen and non-scroll-inducing, but still focusable
    // enough for select() to work.
    textarea.style.position = "fixed";
    textarea.style.inlineSize = "1px";
    textarea.style.blockSize = "1px";
    textarea.style.insetBlockStart = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
