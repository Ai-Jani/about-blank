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
