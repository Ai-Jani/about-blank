export default (elements: HTMLElement[], className: string) => {
  return elements.some((elem) => elem.classList.contains(className));
};
