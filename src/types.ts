// `const obj = { key1: 46, key2: "moji" }` -> `ValuesOf<typeof obj>` -> `46 | "moji"`
export type ValuesOf<T> = T[keyof T];
