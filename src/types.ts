import {
  type App,
  type Command,
  type View,
} from "obsidian";

// `const obj = { key1: 46, key2: "moji" }` -> `ValuesOf<typeof obj>` -> `46 | "moji"`
export type ValuesOf<T> = T[keyof T];

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
