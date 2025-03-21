// Avoid name collision to Obsidian's "isBoolean"
export default (value: any) => {
  return Object.prototype.toString.call(value) === "[object Boolean]";
};
