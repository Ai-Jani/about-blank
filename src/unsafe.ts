import {
  type App,
  type Command,
  type View,
} from "obsidian";

// =============================================================================

export interface UnsafeEmptyView extends View {
  actionListEl: HTMLDivElement;
  emptyTitleEl: HTMLDivElement;
}

export interface UnsafeAppCommands {
  commands: Command[];
  executeCommandById: (id: string) => Promise<boolean>;
}

export interface UnsafeApp extends App {
  commands: UnsafeAppCommands;
}

// Property (method) names that may change in the future.
export const UNSAFE_PROPERTIES = {
  // Property that `leaf.view` of `empty` should have.
  // This is an action list element (div.empty-state-action-list).
  emptyActionListEl: "actionListEl",
  // This is the element that displays the message (div.empty-state-title).
  emptyTitleEL: "emptyTitleEl",
  // `app.commands.commands` / `app.commands.executeCommandById()`
  appCommands: {
    parent: "commands",
    commandsList: "commands",
    executeById: "executeCommandById",
  },
} as const;

export const UNSAFE_CSS_CLASSES = {
  defaultEmptyAction: "empty-state-action tappable", // unsafe
  defaultCloseAction: "mod-close",
} as const;

export const UNSAFE_VIEW_TYPES = {
  empty: "empty", // unsafe
} as const;
