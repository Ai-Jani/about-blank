import {
  type App,
  getIconIds,
  Notice,
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
  editStyles,
} from "src/settings/editStyles";

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
  centerActionListVertically: boolean;
  deleteActionListMarginTop: boolean;
  quickActions: boolean;
  quickActionsIcon: string;
  actions: Action[];
}

export const DEFAULT_SETTINGS: AboutBlankSettings = {
  addActionsToNewTabs: true,
  iconTextGap: 10,
  hideMessage: false,
  hideDefaultActions: HIDE_DEFAULT_ACTIONS.not,
  centerActionListVertically: false,
  deleteActionListMarginTop: false,
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
  centerActionListVertically: (value: unknown) => isBool(value),
  deleteActionListMarginTop: (value: unknown) => isBool(value),
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
  showAppearanceSettings: boolean = false;
  newActionName: string = "";
  switchInfo: boolean = false;
  showCleanUpSettings: boolean = false;

  constructor(app: App, plugin: AboutBlank) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // ---------------------------------------------------------------------------

  display = (): void => {
    try {
      this.containerEl.empty();

      this.makeSettingsAddActions();
      this.makeSettingsQuickActions();
      this.makeSettingsAppearance();
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
                editStyles.rewriteCssVars.emptyStateDisplay.hide();
              } else {
                editStyles.rewriteCssVars.emptyStateDisplay.default();
              }
              await this.plugin.saveSettings();
              new Notice("Reload Obsidian to apply changes", 0);
              this.display();
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
                const placeholder = this.plugin.settings.quickActionsIcon
                  ? this.plugin.settings.quickActionsIcon
                  : "Icon...";
                const response = await new IconSuggesterAsync(
                  this.app,
                  iconIds,
                  placeholder,
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

  private makeSettingsAppearance = (): void => {
    new Setting(this.containerEl)
      .setHeading()
      .setName("Appearance")
      .addExtraButton((button) => {
        const icon = this.showAppearanceSettings ? "chevron-down" : "chevron-left";
        const tooltip = this.showAppearanceSettings ? "Hide" : "Show";
        button
          .setIcon(icon)
          .setTooltip(tooltip)
          .onClick(() => {
            try {
              this.showAppearanceSettings = !this.showAppearanceSettings;
              this.display();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
        setFakeIconToExButtonIfEmpty(button.extraSettingsEl);
      });

    if (this.showAppearanceSettings) {
      makeSettingsHideDefaults(
        this.containerEl,
        this,
      );

      const limit = DEFAULT_SETTINGS_LIMIT.iconTextGap;
      new Setting(this.containerEl)
        .setName("Icon-text gap")
        .setDesc(
          `The gap between the icon and text of the action buttons in the empty file view (new tab). Some community themes may require adjusting this value (e.g. Border theme recommends 0px). <${
            limit?.min ?? ""
          }px - ${limit?.max ?? ""}px (default: ${DEFAULT_SETTINGS.iconTextGap}px)>`,
        )
        .addSlider((slider) => {
          if (!limit || !Number.isFinite(limit.min) || !Number.isFinite(limit.max) || limit.min >= limit.max) {
            return;
          }
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
                editStyles.rewriteCssVars.iconTextGap.set(num);
              } catch (error) {
                loggerOnError(error, "Error in settings.\n(About Blank)");
              }
            });
        });

      new Setting(this.containerEl)
        .setName("Center actions vertically")
        .setDesc(
          "If enabled, the actions in the empty file view (new tab) will be centered vertically. This may not work well with some community themes.",
        )
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.centerActionListVertically)
            .onChange(async (value) => {
              try {
                this.plugin.settings.centerActionListVertically = value;
                if (value) {
                  editStyles.rewriteCssVars.emptyStateContainerMaxHeight.centered();
                } else {
                  editStyles.rewriteCssVars.emptyStateContainerMaxHeight.default();
                }
                await this.plugin.saveSettings();
                this.display();
              } catch (error) {
                loggerOnError(error, "Error in settings.\n(About Blank)");
              }
            });
        });

      new Setting(this.containerEl)
        .setName("Delete actions margin-top (more centered)")
        .setDesc(
          "If enabled, the margin-top of the actions in the empty file view (new tab) will be deleted. When used in combination with the \"Center actions vertically\" setting, it will be centered more.",
        )
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.deleteActionListMarginTop)
            .onChange(async (value) => {
              try {
                this.plugin.settings.deleteActionListMarginTop = value;
                if (value) {
                  editStyles.rewriteCssVars.emptyStateListMarginTop.centered();
                } else {
                  editStyles.rewriteCssVars.emptyStateListMarginTop.default();
                }
                await this.plugin.saveSettings();
                this.display();
              } catch (error) {
                loggerOnError(error, "Error in settings.\n(About Blank)");
              }
            });
        });
    }
  };

  private makeSettingsCleanUp = (): void => {
    const settingItem = new Setting(this.containerEl);
    settingItem
      .setHeading()
      .setName("Clean up settings");
    if (this.showCleanUpSettings) {
      settingItem
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
    }
    settingItem
      .addExtraButton((button) => {
        const icon = this.showCleanUpSettings ? "chevron-down" : "chevron-left";
        const tooltip = this.showCleanUpSettings ? "Hide" : "Show";
        button
          .setIcon(icon)
          .setTooltip(tooltip)
          .onClick(() => {
            try {
              this.showCleanUpSettings = !this.showCleanUpSettings;
              this.display();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
        setFakeIconToExButtonIfEmpty(button.extraSettingsEl);
      });
  };
}
