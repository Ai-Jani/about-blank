// `const obj = { key1: 46, key2: "curry" }` -> `ValuesOf<typeof obj>` -> `46 | "curry"`
export type ValuesOf<T> = T[keyof T];
