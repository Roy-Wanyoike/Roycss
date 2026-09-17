"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  LogIn,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/roycss/auth/auth-context";
import { useAuthSheetStore } from "@/components/roycss/auth/auth-sheet-store";
import {
  API_KEY_NAME_MAX_LENGTH,
  API_KEY_SCOPE_LABELS,
  API_KEY_SCOPES,
  DEFAULT_API_KEY_SCOPES,
  MAX_ACTIVE_KEYS_PER_OWNER,
  useApiKeys,
  type ApiKeyRecord,
  type CreateApiKeyResult,
  type ApiKeyScope,
} from "./use-api-keys";
import { useApiKeysSheetStore } from "./api-keys-sheet-store";

/** Compact date — "Sep 12, 2026" style, locale-aware, API-value fallback. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** What the sheet body shows. `reveal` is the one-time plaintext display. */
type SheetMode = "list" | "create" | "reveal";

/**
 * ApiKeysSheet — the API-key account panel (issue #122 / PRD-F21) over the
 * EXISTING tested endpoints (issue #65): masked list, create with scope
 * picker + ONE-TIME reveal, revoke behind an AlertDialog confirmation.
 * All traffic goes through the api-client/gateway seam (see use-api-keys.ts).
 */
export function ApiKeysSheet() {
  const { open, closeSheet } = useApiKeysSheetStore();
  const { user, loading: authLoading } = useAuth();
  const { openLogin } = useAuthSheetStore();
  // Fetch only for an authenticated, open sheet — the entry points are
  // auth-only, and this guard keeps an anonymous open from ever firing.
  const { keys, loading, error, refresh, createKey, revokeKey } = useApiKeys(
    open && !!user,
  );

  const [mode, setMode] = useState<SheetMode>("list");
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Set<ApiKeyScope>>(
    new Set(DEFAULT_API_KEY_SCOPES),
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<CreateApiKeyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<{ id: string; message: string } | null>(null);

  const activeCount = keys?.filter((k) => k.revokedAt === null).length ?? 0;

  /** Reset all transient state — the one-time key MUST leave memory on close. */
  const reset = () => {
    setMode("list");
    setName("");
    setScopes(new Set(DEFAULT_API_KEY_SCOPES));
    setCreateError(null);
    setReveal(null);
    setCopied(false);
    setRevokeError(null);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      closeSheet();
      reset();
    }
  };

  const toggleScope = (scope: ApiKeyScope, checked: boolean) => {
    setScopes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(scope);
      else next.delete(scope);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0 || scopes.size === 0 || creating) return;
    setCreating(true);
    setCreateError(null);
    const outcome = await createKey(trimmed, [...scopes]);
    setCreating(false);
    if (!outcome.ok) {
      setCreateError(outcome.error);
      return;
    }
    // ONE-TIME reveal — the plaintext never comes back after this.
    setReveal(outcome.result);
    setMode("reveal");
    setName("");
    setScopes(new Set(DEFAULT_API_KEY_SCOPES));
    toast.success("API key created — copy it now, it won't be shown again.");
  };

  const handleCopy = async () => {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the key text and copy it manually.");
    }
  };

  const handleRevoke = async (key: ApiKeyRecord) => {
    setRevokeError(null);
    setRevokingId(key.id);
    const outcome = await revokeKey(key.id);
    setRevokingId(null);
    if (!outcome.ok) {
      setRevokeError({ id: key.id, message: outcome.error });
      return;
    }
    toast.success(`API key “${key.name}” revoked — it stops working immediately.`);
  };

  const signInPrompt = !authLoading && !user;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border/50 shrink-0">
          <SheetTitle className="flex items-center gap-2 font-display">
            <KeyRound className="size-4 text-primary" />
            API Keys
            {keys !== null && (
              <Badge variant="secondary" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                {activeCount} active
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Create and revoke keys for the RoyCSS API, CLI, and MCP server.
            Send them as <code className="font-mono">X-API-Key</code> headers.
          </SheetDescription>
        </SheetHeader>

        {signInPrompt ? (
          /* Defensive: entry points are auth-only, but if the sheet ever
             opens anonymously it must never fire key requests. */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ShieldAlert className="size-7 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              Sign in to manage API keys
            </h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs">
              API keys belong to your RoyCSS account — create one to
              authenticate API, CLI, and MCP-server requests.
            </p>
            <Button
              className="mt-6"
              onClick={() => {
                handleOpenChange(false);
                openLogin();
              }}
            >
              <LogIn className="size-4" />
              Sign in
            </Button>
          </div>
        ) : mode === "reveal" && reveal ? (
          /* ── One-time reveal — the ONLY place the plaintext ever renders ── */
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            <div className="flex flex-col items-center text-center pt-2">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="size-7 text-emerald-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">
                “{reveal.apiKey.name}” is ready
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {reveal.apiKey.masked} ·{" "}
                {reveal.apiKey.scopes.join(", ")}
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <p className="flex items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {reveal.warning}
              </p>
              <p className="text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-400/80">
                This is the only time the full key is shown — it is stored as a
                bcrypt hash and cannot be recovered or re-displayed.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <code
                aria-label="New API key — shown only once"
                className="block font-mono text-xs break-all rounded-lg bg-muted px-3 py-2.5 text-foreground select-all"
              >
                {reveal.key}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9 text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy key
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Use it from the CLI or SDK by sending{" "}
              <code className="font-mono">X-API-Key: {reveal.key.slice(0, 12)}…</code>{" "}
              with your requests. Treat it like a password — it authenticates
              requests on your behalf.
            </p>

            <Button className="w-full" onClick={() => { setReveal(null); setMode("list"); }}>
              Done — I&apos;ve saved my key
            </Button>
          </div>
        ) : mode === "create" ? (
          /* ── Create form ── */
          <form onSubmit={handleCreate} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key-name">Key name</Label>
              <Input
                id="api-key-name"
                required
                autoFocus
                maxLength={API_KEY_NAME_MAX_LENGTH}
                placeholder="e.g. ci-pipeline or my-laptop-cli"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={creating}
                aria-describedby="api-key-name-hint"
              />
              <p id="api-key-name-hint" className="text-[11px] text-muted-foreground">
                Shown in the list below. Must be unique per account, at most{" "}
                {API_KEY_NAME_MAX_LENGTH} characters.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Scopes</legend>
              <p className="text-[11px] text-muted-foreground">
                What requests made with this key may do. At least one scope is
                required; scopes are enforced per endpoint.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {API_KEY_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-xs cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    <Checkbox
                      checked={scopes.has(scope)}
                      onCheckedChange={(checked) =>
                        toggleScope(scope, checked === true)
                      }
                      disabled={creating}
                      aria-label={API_KEY_SCOPE_LABELS[scope]}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-foreground truncate">
                        {API_KEY_SCOPE_LABELS[scope]}
                      </span>
                      <span className="block font-mono text-[11px] text-muted-foreground truncate">
                        {scope}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {scopes.has("*") && (
                <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  The wildcard scope grants every endpoint — prefer narrow
                  scopes unless you need full account access.
                </p>
              )}
            </fieldset>

            {createError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={creating || name.trim().length === 0 || scopes.size === 0}>
                {creating && <Loader2 className="size-4 mr-2 animate-spin" />}
                {creating ? "Creating..." : "Create key"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={creating}
                onClick={() => {
                  setMode("list");
                  setCreateError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* ── List ── */
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-3 border-b border-border/50 shrink-0 flex items-center justify-between gap-2">
              <Button
                size="sm"
                onClick={() => setMode("create")}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={activeCount >= MAX_ACTIVE_KEYS_PER_OWNER}
                title={
                  activeCount >= MAX_ACTIVE_KEYS_PER_OWNER
                    ? `At most ${MAX_ACTIVE_KEYS_PER_OWNER} active keys per account — revoke one first`
                    : undefined
                }
              >
                <Plus className="size-3.5" />
                New API key
              </Button>
              {activeCount >= MAX_ACTIVE_KEYS_PER_OWNER && (
                <span className="text-[11px] text-muted-foreground">
                  Active-key limit reached ({MAX_ACTIVE_KEYS_PER_OWNER})
                </span>
              )}
            </div>

            {/* Load error — inline alert with retry (pricing waitlist pattern). */}
            {error && (
              <div className="p-3">
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <span>{error}</span>
                    <div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={loading} onClick={() => void refresh()}>
                        Try again
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Revoke error — same inline-alert pattern, retry re-issues the revoke. */}
            {revokeError && !error && (
              <div className="p-3">
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <span>{revokeError.message}</span>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          const retryId = revokeError.id;
                          setRevokeError(null);
                          const target = keys?.find((k) => k.id === retryId);
                          if (target && target.revokedAt === null) void handleRevoke(target);
                        }}
                      >
                        Try again
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && keys === null ? (
              <div className="p-3 space-y-2" aria-label="Loading API keys">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : !error && (keys === null || keys.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <KeyRound className="size-7 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground">No API keys yet</h3>
                <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                  Create a key to call the RoyCSS API from scripts, the CLI, or
                  an MCP server without sharing your password.
                </p>
                <Button size="sm" className="mt-5" onClick={() => setMode("create")}>
                  <Plus className="size-3.5" />
                  Create your first API key
                </Button>
              </div>
            ) : keys !== null ? (
              <div className="p-3 space-y-2">
                {keys.map((key) => (
                  <ApiKeyRow
                    key={key.id}
                    apiKey={key}
                    revoking={revokingId === key.id}
                    onRevoke={handleRevoke}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Honest limits — mirror the backend's real configuration. */}
        {!signInPrompt && mode !== "reveal" && (
          <div className="p-3 border-t border-border/50 shrink-0 text-[11px] leading-relaxed text-muted-foreground">
            Up to {MAX_ACTIVE_KEYS_PER_OWNER} active keys per account ·
            management actions share the auth rate limit (10 requests/min) ·
            keys in use are rate-limited to 120 requests/min each · a revoked
            key stops working immediately.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** One masked key row — never renders secret material. */
function ApiKeyRow({
  apiKey,
  revoking,
  onRevoke,
}: {
  apiKey: ApiKeyRecord;
  revoking: boolean;
  onRevoke: (key: ApiKeyRecord) => void;
}) {
  const revoked = apiKey.revokedAt !== null;
  return (
    <div
      className={`rounded-xl border border-border bg-card p-3 ${
        revoked ? "opacity-60" : "hover:border-primary/30"
      } transition-colors`}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
          {apiKey.name}
        </p>
        {revoked ? (
          <Badge variant="secondary" className="text-[11px] bg-muted text-muted-foreground">
            Revoked
          </Badge>
        ) : revoking ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-label="Revoking" />
        ) : (
          /* Destructive + irreversible — confirm first (favorites clear-all pattern). */
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                aria-label={`Revoke API key ${apiKey.name}`}
              >
                <Trash2 className="size-3.5" />
                Revoke
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke API key “{apiKey.name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  Requests using {apiKey.masked} will fail immediately with a
                  401. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void onRevoke(apiKey)}
                  className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60"
                >
                  Revoke key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground truncate">
        {apiKey.masked}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {apiKey.scopes.map((scope) => (
          <Badge
            key={scope}
            variant="outline"
            className={`text-[11px] ${
              scope === "*"
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground"
            }`}
          >
            {scope}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Created {formatDate(apiKey.createdAt)} ·{" "}
        {apiKey.lastUsedAt ? `Last used ${formatDate(apiKey.lastUsedAt)}` : "Never used"}
        {revoked && apiKey.revokedAt ? ` · Revoked ${formatDate(apiKey.revokedAt)}` : ""}
      </p>
    </div>
  );
}
