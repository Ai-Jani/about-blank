export default (array: unknown[], newItem: unknown = null): boolean => {
  const specimens = newItem ? [...array, newItem] : array;
  return new Set(specimens).size !== specimens.length;
};
