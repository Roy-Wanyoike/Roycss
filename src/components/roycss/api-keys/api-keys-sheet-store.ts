"use client";

import { create } from "zustand";

/**
 * ApiKeysSheetStore — controls whether the API-key management sheet is open.
 *
 * Mirrors auth-sheet-store.ts: minimal state (is the sheet open) so any
 * component in the tree can open the account panel without prop drilling.
 * The sheet itself is mounted once at the page root (next to AuthSheets).
 */
interface ApiKeysSheetState {
  open: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

export const useApiKeysSheetStore = create<ApiKeysSheetState>((set) => ({
  open: false,
  openSheet: () => set({ open: true }),
  closeSheet: () => set({ open: false }),
}));
