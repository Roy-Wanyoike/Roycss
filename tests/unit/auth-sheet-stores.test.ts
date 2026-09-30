import { beforeEach, describe, it, expect } from "vitest";
import { useAuthSheetStore } from "@/components/roycss/auth/auth-sheet-store";
import { useApiKeysSheetStore } from "@/components/roycss/api-keys/api-keys-sheet-store";

/**
 * State-machine pins for the two tiny zustand sheet stores (issue #277).
 *
 * Both stores are the single source of truth for which account sheet is
 * open (any component can open a sheet without prop drilling), so their
 * transition contract is load-bearing:
 *
 *   auth-sheet-store:   openLogin ⇄ openRegister (mutually exclusive),
 *                       closeAll() closes both.
 *   api-keys-sheet-store: openSheet / closeSheet boolean toggle.
 */

describe("useAuthSheetStore state machine", () => {
  beforeEach(() => {
    // Reset the module-level singleton between tests for isolation.
    useAuthSheetStore.setState({ loginOpen: false, registerOpen: false });
  });

  it("starts with both sheets closed", () => {
    const s = useAuthSheetStore.getState();
    expect(s.loginOpen).toBe(false);
    expect(s.registerOpen).toBe(false);
  });

  it("openLogin opens ONLY the login sheet", () => {
    useAuthSheetStore.getState().openLogin();
    const s = useAuthSheetStore.getState();
    expect(s.loginOpen).toBe(true);
    expect(s.registerOpen).toBe(false);
  });

  it("openRegister opens ONLY the register sheet", () => {
    useAuthSheetStore.getState().openRegister();
    const s = useAuthSheetStore.getState();
    expect(s.registerOpen).toBe(true);
    expect(s.loginOpen).toBe(false);
  });

  it("switching login → register is mutually exclusive (no half-open state)", () => {
    const store = useAuthSheetStore.getState();
    store.openLogin();
    useAuthSheetStore.getState().openRegister();
    let s = useAuthSheetStore.getState();
    expect(s.loginOpen).toBe(false);
    expect(s.registerOpen).toBe(true);

    useAuthSheetStore.getState().openLogin();
    s = useAuthSheetStore.getState();
    expect(s.loginOpen).toBe(true);
    expect(s.registerOpen).toBe(false);
  });

  it("openLogin is idempotent (re-click keeps exactly the login sheet open)", () => {
    const store = useAuthSheetStore.getState();
    store.openLogin();
    useAuthSheetStore.getState().openLogin();
    const s = useAuthSheetStore.getState();
    expect(s.loginOpen).toBe(true);
    expect(s.registerOpen).toBe(false);
  });

  it("closeAll closes both sheets from any state", () => {
    const store = useAuthSheetStore.getState();
    store.openRegister();
    useAuthSheetStore.getState().closeAll();
    let s = useAuthSheetStore.getState();
    expect(s.loginOpen).toBe(false);
    expect(s.registerOpen).toBe(false);

    // Closing an already-closed store is a safe no-op.
    useAuthSheetStore.getState().closeAll();
    s = useAuthSheetStore.getState();
    expect(s.loginOpen).toBe(false);
    expect(s.registerOpen).toBe(false);
  });
});

describe("useApiKeysSheetStore state machine", () => {
  beforeEach(() => {
    useApiKeysSheetStore.setState({ open: false });
  });

  it("starts closed", () => {
    expect(useApiKeysSheetStore.getState().open).toBe(false);
  });

  it("openSheet opens the sheet", () => {
    useApiKeysSheetStore.getState().openSheet();
    expect(useApiKeysSheetStore.getState().open).toBe(true);
  });

  it("closeSheet closes the sheet", () => {
    const store = useApiKeysSheetStore.getState();
    store.openSheet();
    store.closeSheet();
    expect(useApiKeysSheetStore.getState().open).toBe(false);
  });

  it("is idempotent in both directions (open while open, close while closed)", () => {
    const store = useApiKeysSheetStore.getState();
    store.openSheet();
    store.openSheet();
    expect(useApiKeysSheetStore.getState().open).toBe(true);

    store.closeSheet();
    store.closeSheet();
    expect(useApiKeysSheetStore.getState().open).toBe(false);
  });
});
