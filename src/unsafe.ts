import {
  type App,
  type Command,
  type View,
} from "obsidian";

// =============================================================================

export const UNSAFE_CSS_CLASSES = {
  defaultEmptyAction: "empty-state-action tappable",
  defaultCloseAction: "mod-close",
  // Since Obsidian 1.14 the empty file view renders its actions as pills:
  //   <div class="text-icon-button tappable mod-pill empty-state-action">
  //     <span class="text-button-icon">…</span>
  //     <span class="text-button-label">…</span>
  //   </div>
  // An action element with only `empty-state-action` is no longer styled,
  // so the same classes are used for the actions added by About Blank.
  textIconButton: "text-icon-button",
  modPill: "mod-pill",
  textButtonIcon: "text-button-icon",
  textButtonLabel: "text-button-label",
} as const;

// =============================================================================

export const UNSAFE_VIEW_TYPES = {
  empty: "empty",
} as const;

export interface UnsafeEmptyActionListEl extends HTMLDivElement {
  children: HTMLCollection;
}

export interface UnsafeEmptyView extends View {
  // Property that `leaf.view` of `empty` should have.
  // This is an action list element (div.empty-state-action-list).
  actionListEl: UnsafeEmptyActionListEl;
  // This is the element that displays the message (div.empty-state-title).
  emptyTitleEl: HTMLDivElement;
}

// =============================================================================

export interface UnsafeAppCommands {
  commands: Command[];
  executeCommandById: (id: string) => Promise<boolean>;
}

export interface UnsafeApp extends App {
  commands: UnsafeAppCommands;
}
