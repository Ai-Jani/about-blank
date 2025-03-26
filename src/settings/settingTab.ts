import {
  type App,
  getIconIds,
  PluginSettingTab,
  Setting,
} from "obsidian";

import {
  type Action,
  makeSettingsActionsHeader,
  makeSettingsActionsList,
} from "src/settings/action";

import {
  HIDE_DEFAULT_ACTIONS,
  makeSettingsHideDefaults,
} from "src/settings/hideDefault";

import {
  IconSuggesterAsync,
} from "src/ui/iconSuggesterAsync";

import isBool from "src/utils/isBool";

import loggerOnError from "src/utils/loggerOnError";

import {
  objectDeepCopy,
} from "src/utils/objectDeepCopy";

import {
  setFakeIconToExButtonIfEmpty,
} from "src/commons";

import {
  CSS_VARS,
} from "src/constants";

import type AboutBlank from "src/main";

import {
  type ValuesOf,
} from "src/types";

// =============================================================================

export interface AboutBlankSettings {
  addActionsToNewTabs: boolean;
  hideMessage: boolean;
  hideDefaultActions: ValuesOf<typeof HIDE_DEFAULT_ACTIONS>;
  quickActions: boolean;
  quickActionsIcon: string;
  actions: Action[];
}

export const DEFAULT_SETTINGS: AboutBlankSettings = {
  addActionsToNewTabs: true,
  hideMessage: false,
  hideDefaultActions: HIDE_DEFAULT_ACTIONS.not,
  quickActions: false,
  quickActionsIcon: "",
  actions: [],
} as const;

// =============================================================================

export const settingsPropTypeCheck: {
  [key in keyof AboutBlankSettings]: (value: any) => boolean;
} = {
  addActionsToNewTabs: (value: any) => isBool(value),
  hideMessage: (value: any) => isBool(value),
  hideDefaultActions: (value: any) => {
    const correctValues: any[] = Object.values(HIDE_DEFAULT_ACTIONS);
    return correctValues.includes(value);
  },
  quickActions: (value: any) => isBool(value),
  quickActionsIcon: (value: any) => typeof value === "string",
  actions: (value: any) => Array.isArray(value),
};

// =============================================================================

export const defaultSettingsClone = (): AboutBlankSettings => {
  return objectDeepCopy(DEFAULT_SETTINGS);
};

// =============================================================================

export class AboutBlankSettingTab extends PluginSettingTab {
  plugin: AboutBlank;
  newActionName: string = "";
  switchInfo: boolean = false;

  constructor(app: App, plugin: AboutBlank) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // ---------------------------------------------------------------------------

  display = (): void => {
    try {
      this.containerEl.empty();

      this.makeSettingsAddActions();
      makeSettingsHideDefaults(
        this.containerEl,
        this,
      );
      this.makeSettingsQuickActions();
      makeSettingsActionsHeader(
        this.containerEl,
        this,
        this.plugin.settings,
        true,
        null,
        "Actions",
        "These actions can be added to New tabs.",
      );
      makeSettingsActionsList(
        this.containerEl,
        this,
        0,
        this.plugin.settings,
        true,
      );
      this.makeSettingsCleanUp();
    } catch (error) {
      loggerOnError(error, "Error in settings.\n(About Blank)");
    }
  };

  private makeSettingsAddActions = (): void => {
    new Setting(this.containerEl)
      .setName("Add actions to New tabs")
      .setDesc(
        "If enabled, the 'Actions' will be added to New tabs. After changing this setting, require to reload Obsidian.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.addActionsToNewTabs)
          .onChange(async (value) => {
            try {
              this.plugin.settings.addActionsToNewTabs = value;
              if (value) {
                document.documentElement.style.removeProperty(CSS_VARS.emptyStateDisplay);
              } else {
                document.documentElement.style.setProperty(
                  CSS_VARS.emptyStateDisplay,
                  CSS_VARS.defaultDisplayValue,
                );
              }
              await this.plugin.saveSettings();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
      });
  };

  private makeSettingsQuickActions = (): void => {
    const settingItem = new Setting(this.containerEl);
    settingItem
      .setName("Quick actions")
      .setDesc("Actions to be added to New tabs are compiled into suggesters and registered as commands in Obsidian.");
    if (this.plugin.settings.quickActions === true) {
      settingItem
        .addExtraButton((button) => {
          button
            .setIcon(this.plugin.settings.quickActionsIcon)
            .setTooltip("Set icon")
            .onClick(async () => {
              try {
                const noIconId = "*No icon*";
                const iconIds = getIconIds();
                iconIds.unshift(noIconId);
                const response = await new IconSuggesterAsync(
                  this.app,
                  iconIds,
                  "Icon...",
                ).openAndRespond();
                if (response.aborted) {
                  return;
                } else if (response.result === noIconId) {
                  this.plugin.settings.quickActionsIcon = "";
                } else {
                  this.plugin.settings.quickActionsIcon = response.result;
                }
                if (this.plugin.settings.quickActions === true) {
                  this.plugin.registerQuickActions(); // Overwrite
                }
                this.display();
              } catch (error) {
                loggerOnError(error, "Error in settings.\n(About Blank)");
              }
            });
          setFakeIconToExButtonIfEmpty(button.extraSettingsEl);
        });
    }
    settingItem
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.quickActions)
          .onChange(async (value) => {
            try {
              this.plugin.settings.quickActions = value;
              await this.plugin.saveSettings();
              if (this.plugin.settings.quickActions === true) {
                this.plugin.registerQuickActions(); // Overwrite
              } else {
                this.plugin.unregisterQuickActions();
              }
              this.display();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
      });
  };

  private makeSettingsCleanUp = (): void => {
    new Setting(this.containerEl)
      .setHeading()
      .setName("Clean up settings")
      .setDesc(
        "It checks the settings data, type or value, duplicate command IDs, etc., and initializes any abnormal parts. Details of the changes are output to the console. These changes are not actually saved unless triggered. They can be discarded by reloading Obsidian.",
      )
      .addButton((button) => {
        button
          .setWarning()
          .setButtonText("Clean up")
          .onClick(() => {
            try {
              this.plugin.cleanUpSettings();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
      });
  };
}
