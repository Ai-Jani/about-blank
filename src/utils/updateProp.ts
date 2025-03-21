export default <T, K extends keyof T>(obj: T, key: K, value: T[K]): void => {
  obj[key] = value;
};
