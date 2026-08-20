"use client";

import { create } from "zustand";

/**
 * AuthSheetStore — controls which auth Sheet is open.
 *
 * State is minimal (which sheet is open) so that any component in
 * the tree can open the login or register sheet without prop
 * drilling. Both sheets close on `closeAll()`.
 */
interface AuthSheetState {
  loginOpen: boolean;
  registerOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  closeAll: () => void;
}

export const useAuthSheetStore = create<AuthSheetState>((set) => ({
  loginOpen: false,
  registerOpen: false,
  openLogin: () => set({ loginOpen: true, registerOpen: false }),
  openRegister: () => set({ registerOpen: true, loginOpen: false }),
  closeAll: () => set({ loginOpen: false, registerOpen: false }),
}));
