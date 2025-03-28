import {
  CSS_CLASSES,
} from "src/constants";

// =============================================================================

// If the `setIcon()` of `Setting.addExtraButton()` receives an invalid value,
// it will fail to set the icon, resulting in inconveniences such as the button
// size becoming extremely small.
// This function creates a DIV element inside the button if no element (such as SVG)
// has been created inside the button. Then assign a class to the button itself and
// to the DIV element inside it.
// The actual appearance is applied in `styles.css`.
export const setFakeIconToExButtonIfEmpty = (exButtonEl: HTMLElement) => {
  if (!exButtonEl.hasChildNodes()) {
    exButtonEl.classList.add(CSS_CLASSES.fakeExButton);
    exButtonEl.createEl("div", { cls: CSS_CLASSES.fakeIcon });
  }
};

export const setFakeIconToIconText = (iconEl: HTMLElement) => {
  if (!iconEl.hasChildNodes()) {
    iconEl.createEl("div", { cls: CSS_CLASSES.fakeIcon });
  }
};
