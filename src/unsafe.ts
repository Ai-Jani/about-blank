import {
  type App,
  type Command,
  type View,
} from "obsidian";

// =============================================================================

export const UNSAFE_VIEW_TYPES = {
  empty: "empty",
} as const;

export interface UnsafeEmptyActionListEl extends HTMLDivElement {
  children: HTMLCollection;
}

export interface UnsafeEmptyView extends View {
  actionListEl: UnsafeEmptyActionListEl;
  emptyTitleEl: HTMLDivElement;
}

export const UNSAFE_EMPTY_PROPERTIES: Record<string, keyof UnsafeEmptyView> = {
  // Property that `leaf.view` of `empty` should have.
  // This is an action list element (div.empty-state-action-list).
  emptyActionListEl: "actionListEl",
  // This is the element that displays the message (div.empty-state-title).
  emptyTitleEL: "emptyTitleEl",
} as const;

// =============================================================================

export interface UnsafeAppCommands {
  commands: Command[];
  executeCommandById: (id: string) => Promise<boolean>;
}

export interface UnsafeApp extends App {
  commands: UnsafeAppCommands;
}

export const UNSAFE_PROPERTIES = {
  // `app.commands.commands` / `app.commands.executeCommandById()`
  appCommands: {
    parent: "commands",
    commandsList: "commands",
    executeById: "executeCommandById",
  },
} as const;

export const UNSAFE_CSS_CLASSES = {
  defaultEmptyAction: "empty-state-action tappable",
  defaultCloseAction: "mod-close",
} as const;
