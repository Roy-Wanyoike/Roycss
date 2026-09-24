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
 *
 * When BOTH paths fail (hardened browsers, non-secure origins, headless
 * automation — a QA round proved clipboard access can be NotAllowedError
 * even with the API present), callers flip to an accessible
 * "Copy failed — press Ctrl+C / ⌘C" state (`CLIPBOARD_FAILED_MESSAGE`) and
 * call {@link selectElementText} on the element that renders the payload so
 * the user can select it and copy manually. Both paths failing is reported
 * as `false` — never thrown, never silent.
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
    return execCommandCopy(text);
  } catch {
    return false;
  }
}

/**
 * One-shot legacy copy: temporary off-screen `<textarea>` + `execCommand`.
 * The textarea is always removed (even when execCommand throws) so failed
 * attempts never leave stray nodes in the DOM.
 */
function execCommandCopy(text: string): boolean {
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
  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

/** Visible + announced text when BOTH copy paths fail (manual Ctrl+C / ⌘C). */
export const CLIPBOARD_FAILED_MESSAGE = "Copy failed — press Ctrl+C / ⌘C";

/** How long the "Copy failed" state stays visible before auto-resetting. */
export const CLIPBOARD_FAILED_RESET_MS = 4000;

/**
 * Select the full text content of `element` (window.getSelection + Range)
 * so a user whose clipboard is blocked can hit Ctrl+C / ⌘C themselves.
 * Returns false when there is no element or the selection API is missing /
 * throws — never throws into the caller's copy handler.
 */
export function selectElementText(
  element: Element | null | undefined,
): boolean {
  if (
    !element ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return false;
  }
  try {
    const selection = window.getSelection();
    if (!selection) return false;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
}
