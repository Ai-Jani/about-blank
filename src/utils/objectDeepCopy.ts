const arrayDeepCopy = <T>(arr: T[]): T[] => {
  return arr.map((item) => objectDeepCopy(item));
};

export const objectDeepCopy = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  if (obj instanceof RegExp) {
    return new RegExp(obj) as T;
  }
  if (obj instanceof Map) {
    return new Map(objectDeepCopy(Array.from(obj))) as T;
  }
  if (obj instanceof Set) {
    return new Set(objectDeepCopy(Array.from(obj))) as T;
  }
  if (Array.isArray(obj)) {
    return arrayDeepCopy(obj) as T;
  }
  const copy = {} as T;
  Object.keys(obj).forEach((key) => {
    copy[key as keyof T] = objectDeepCopy(obj[key as keyof T]);
  });
  return copy;
};
