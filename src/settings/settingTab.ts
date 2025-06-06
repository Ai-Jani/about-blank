import {
  type App,
  getIconIds,
  PluginSettingTab,
  Setting,
} from "obsidian";

import {
  type Action,
} from "src/settings/action-basic";

import {
  makeSettingsActionsHeader,
  makeSettingsActionsList,
} from "src/settings/action-settings";

import {
  HIDE_DEFAULT_ACTIONS,
  makeSettingsHideDefaults,
} from "src/settings/hideDefault";

import {
  IconSuggesterAsync,
} from "src/ui/iconSuggesterAsync";

import isBool from "src/utils/isBool";

import {
  objectDeepCopy,
} from "src/utils/objectDeepCopy";

import {
  adjustInt,
  loggerOnError,
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
  iconTextGap: number;
  hideMessage: boolean;
  hideDefaultActions: ValuesOf<typeof HIDE_DEFAULT_ACTIONS>;
  quickActions: boolean;
  quickActionsIcon: string;
  actions: Action[];
}

export const DEFAULT_SETTINGS: AboutBlankSettings = {
  addActionsToNewTabs: true,
  iconTextGap: 10,
  hideMessage: false,
  hideDefaultActions: HIDE_DEFAULT_ACTIONS.not,
  quickActions: false,
  quickActionsIcon: "",
  actions: [],
} as const;

export const DEFAULT_SETTINGS_LIMIT: Partial<
  {
    [key in keyof AboutBlankSettings]: { min: number; max: number; };
  }
> = {
  iconTextGap: {
    min: 0,
    max: 50,
  },
} as const;

// =============================================================================

export const settingsPropTypeCheck: {
  [key in keyof AboutBlankSettings]: (value: unknown) => boolean;
} = {
  addActionsToNewTabs: (value: unknown) => isBool(value),
  iconTextGap: (value: unknown) => {
    if (!Number.isFinite(value)) {
      return false;
    }
    const num = value as number;
    const limit = DEFAULT_SETTINGS_LIMIT.iconTextGap;
    if (!limit) {
      return false;
    }
    return limit.min <= num && num <= limit.max;
  },
  hideMessage: (value: unknown) => isBool(value),
  hideDefaultActions: (value: unknown) => {
    const correctValues: unknown[] = Object.values(HIDE_DEFAULT_ACTIONS);
    return correctValues.includes(value);
  },
  quickActions: (value: unknown) => isBool(value),
  quickActionsIcon: (value: unknown) => typeof value === "string",
  actions: (value: unknown) => Array.isArray(value),
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
        "These actions can be added to the empty file view (new tab).",
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
      .setName("Add actions to the empty file view (new tab)")
      .setDesc(
        "If enabled, the \"Actions\" will be added to the empty file view (new tab). After changing this setting, require to reload Obsidian.",
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
              this.display();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
      });
    if (this.plugin.settings.addActionsToNewTabs) {
      const limit = DEFAULT_SETTINGS_LIMIT.iconTextGap;
      if (!limit) {
        return;
      }
      new Setting(this.containerEl)
        .setName("Icon-text gap")
        .setDesc(
          `The gap between the icon and text of the action buttons. Some community themes may require adjusting this value (e.g. Border theme recommends 0px). <${limit.min}px - ${limit.max}px (default: ${DEFAULT_SETTINGS.iconTextGap}px)>`,
        )
        .addSlider((slider) => {
          slider
            .setLimits(limit.min, limit.max, 1)
            .setValue(adjustInt(this.plugin.settings.iconTextGap))
            .setDynamicTooltip()
            .onChange(async (value) => {
              try {
                const num = adjustInt(value);
                if (!settingsPropTypeCheck.iconTextGap(num)) {
                  return;
                }
                this.plugin.settings.iconTextGap = num;
                await this.plugin.saveSettings();
                document.documentElement.style.setProperty(
                  CSS_VARS.iconTextGap,
                  `${num}px`,
                );
              } catch (error) {
                loggerOnError(error, "Error in settings.\n(About Blank)");
              }
            });
        });
    }
  };

  private makeSettingsQuickActions = (): void => {
    const settingItem = new Setting(this.containerEl);
    settingItem
      .setName("Quick actions")
      .setDesc(
        "Actions to be added to the empty file view (new tab) are compiled into suggesters and registered as commands in Obsidian.",
      );
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
