// Shared types for messages between content script, service worker, popup, and side panel.
// Kept in this file (not a separate types.ts) to minimize the module surface.

export type MessageType =
  | "scan-complete"
  | "effect-selected"
  | "open-side-panel"
  | "get-scan"
  | "rescan"
  | "toggle";

export interface ScanCompleteMessage {
  type: "scan-complete";
  count: number;
  durationMs: number;
  topEffects: Array<{ effectId: string; className: string }>;
}

export interface EffectSelectedMessage {
  type: "effect-selected";
  effectId: string;
  className: string;
}

export interface OpenSidePanelMessage {
  type: "open-side-panel";
}

export interface GetScanMessage {
  type: "get-scan";
}

export interface RescanMessage {
  type: "rescan";
}

export interface ToggleMessage {
  type: "toggle";
  enabled: boolean;
}

export type InspectorMessage =
  | ScanCompleteMessage
  | EffectSelectedMessage
  | OpenSidePanelMessage
  | GetScanMessage
  | RescanMessage
  | ToggleMessage;
