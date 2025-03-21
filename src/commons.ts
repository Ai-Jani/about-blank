import {
  v4 as uuidv4,
} from "uuid";

import {
  type Action,
  ACTION_KINDS,
  newActionClone,
} from "src/settings/action";

import {
  type AboutBlankSettings,
} from "src/settings/settingTab";

import {
  CSS_CLASSES,
  LOOP_MAX,
} from "src/constants";

// =============================================================================

export const allActionsBloodline = (actions: Action[]): Action[] => {
  return actions.flatMap((action) => {
    if (action.content.kind === ACTION_KINDS.group) {
      return [action, ...allActionsBloodline(action.content.actions)];
    }
    return action;
  });
};

// If omit the `settings` argument, it will simply return the UUID.
// If a `settings` is provided, it checks for duplicates and returns a unique ID.
export const genNewCmdId = (settings?: AboutBlankSettings): string => {
  if (settings === undefined) {
    return uuidv4();
  }

  // Unique ID
  const allActions = allActionsBloodline(settings.actions);
  const currentCmdIds = allActions.map((action) => action.cmdId);
  for (let i = 0; i < LOOP_MAX; i++) {
    const candidate = uuidv4();
    if (!currentCmdIds.includes(candidate)) {
      return candidate;
    }
  }
  console.warn("About Blank: Failed to generate a unique command ID.");
  return newActionClone().cmdId;
};

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
