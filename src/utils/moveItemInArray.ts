export default <T>(
  array: T[],
  index: number,
  direction: 1 | -1,
  anywhereDoor: boolean = false,
): T[] => {
  const invalidArgs = !Array.isArray(array) || array.length === 0
    || index < 0 || array.length <= index
    || (direction !== 1 && direction !== -1);
  if (invalidArgs) {
    return array;
  }
  const newIndex = index + direction;
  if (newIndex < 0) {
    if (anywhereDoor) {
      array.push(array.shift() as T);
    }
  } else if (array.length <= newIndex) {
    if (anywhereDoor) {
      array.unshift(array.pop() as T);
    }
  } else {
    [array[index], array[newIndex]] = [array[newIndex], array[index]];
  }
  return array;
};
