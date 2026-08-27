/**
 * Global type augmentations for RoyCSS runtime.
 *
 * `window.__roycssNonce` is set by the application's CSP middleware
 * (or the layout) to the per-request nonce for `<style>` tags. The
 * dynamic effect CSS injector reads it so dynamically-injected
 * <style> tags comply with the page's Content-Security-Policy.
 */
export {};

declare global {
  interface Window {
    /** CSP nonce to apply to dynamically-injected <style> tags. */
    __roycssNonce?: string;
  }
}
