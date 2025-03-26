import {
  Setting,
} from "obsidian";

import {
  type AboutBlankSettingTab,
} from "src/settings/settingTab";

import loggerOnError from "src/utils/loggerOnError";

import {
  type ValuesOf,
} from "src/types";

// =============================================================================

export const HIDE_DEFAULT_ACTIONS = {
  not: "notHide",
  close: "onlyClose",
  all: "all",
} as const;

export const HIDE_DEFAULT_ACTIONS_NAME: {
  [key in ValuesOf<typeof HIDE_DEFAULT_ACTIONS>]: string;
} = {
  notHide: "Not hide",
  onlyClose: "Only close",
  all: "All",
} as const;

// =============================================================================

export const makeSettingsHideDefaults = (
  elem: HTMLElement,
  page: AboutBlankSettingTab,
): void => {
  new Setting(elem)
    .setName("Hide message")
    .setDesc("This hides the message in New tabs. (e.g. 'No file is open')")
    .addToggle((toggle) => {
      toggle
        .setValue(page.plugin.settings.hideMessage)
        .onChange(async (value) => {
          try {
            page.plugin.settings.hideMessage = value;
            await page.plugin.saveSettings();
          } catch (error) {
            loggerOnError(error, "Error in settings.\n(About Blank)");
          }
        });
    });
  new Setting(elem)
    .setName("Hide default actions")
    .setDesc("This hides the default actions in New tabs. (e.g. 'Create new note', 'Close')")
    .addDropdown((dropdown) => {
      dropdown
        .addOptions(HIDE_DEFAULT_ACTIONS_NAME)
        .setValue(page.plugin.settings.hideDefaultActions)
        .onChange(async (value: ValuesOf<typeof HIDE_DEFAULT_ACTIONS>) => {
          try {
            if (!Object.values(HIDE_DEFAULT_ACTIONS).includes(value)) {
              return;
            }
            page.plugin.settings.hideDefaultActions = value;
            await page.plugin.saveSettings();
          } catch (error) {
            loggerOnError(error, "Error in settings.\n(About Blank)");
          }
        });
    });
};
