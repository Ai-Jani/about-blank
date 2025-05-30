import {
  type App,
  setIcon,
  Setting,
  type TFile,
} from "obsidian";

import {
  type Action,
  ACTION_INFO_ICON,
  ACTION_KINDS,
  ACTION_KINDS_ICON,
  ACTION_KINDS_NAME,
  type ContentOfGroup,
  type ContentType,
  createNewAction,
  newContentOfCommandClone,
  newContentOfFileClone,
  newContentOfGroupClone,
} from "src/settings/action-basic";

import {
  moveAction,
} from "src/settings/action-edit";

import {
  ActionSettingsModal,
} from "src/settings/action-settingsModal";

import {
  type AboutBlankSettings,
  type AboutBlankSettingTab,
} from "src/settings/settingTab";

import {
  StringSuggesterAsync,
} from "src/ui/stringSuggesterAsync";

import isFalsyString from "src/utils/isFalsyString";

import {
  loggerOnError,
  setFakeIconToExButtonIfEmpty,
  setFakeIconToIconText,
} from "src/commons";

import {
  CSS_CLASSES,
} from "src/constants";

import {
  type ValuesOf,
} from "src/types";

import {
  type UnsafeApp,
} from "src/unsafe";

// =============================================================================

export const chooseKindAndContent = async (
  app: App,
): Promise<ContentType | void> => {
  const kind = await chooseKind(app);
  if (kind === undefined) {
    return;
  }

  return chooseContent(app, kind);
};

export const chooseKind = async (
  app: App,
): Promise<ValuesOf<typeof ACTION_KINDS> | void> => {
  const kindItems = Object.values(ACTION_KINDS).map((kind) => {
    return {
      name: ACTION_KINDS_NAME[kind],
      value: kind,
    };
  });

  const kindResponse = await new StringSuggesterAsync(
    app,
    kindItems,
    "Kind...",
  ).openAndRespond();
  if (kindResponse.aborted) {
    return;
  }

  return kindResponse.result.value as ValuesOf<typeof ACTION_KINDS>;
};

export const chooseContent = async (
  app: App,
  kind: ValuesOf<typeof ACTION_KINDS>,
): Promise<ContentType | void> => {
  if (kind === ACTION_KINDS.group) {
    return newContentOfGroupClone();
  }

  const result = await chooseCommandOrFile(app, kind);
  if (result === undefined) {
    return;
  }

  if (kind === ACTION_KINDS.file) {
    const content = newContentOfFileClone();
    content.fileName = result.name;
    content.filePath = result.value;
    return content;
  }

  // kind === ACTION_KINDS.command
  const content = newContentOfCommandClone();
  content.commandName = result.name;
  content.commandId = result.value;
  return content;
};

export const chooseCommandOrFile = async (
  app: App,
  kind: typeof ACTION_KINDS.command | typeof ACTION_KINDS.file,
): Promise<
  {
    name: string;
    value: string;
  } | void
> => {
  const items = (() => {
    if (kind === ACTION_KINDS.command) {
      const commandsList = (app as UnsafeApp).commands.commands;
      return Object.values(commandsList).map((command) => {
        return {
          name: command.name,
          value: command.id,
        };
      });
    } else if (kind === ACTION_KINDS.file) {
      return app.vault.getFiles().map((file: TFile) => {
        return {
          name: file.name,
          value: file.path,
        };
      });
    }
    return;
  })();
  if (items === undefined) {
    return;
  }

  const response = await new StringSuggesterAsync(
    app,
    items,
    `${ACTION_KINDS_NAME[kind]}...`,
  ).openAndRespond();
  if (response.aborted) {
    return;
  }

  return response.result;
};

// =============================================================================

export const makeSettingsActionsHeader = (
  elem: HTMLElement,
  page: AboutBlankSettingTab | ActionSettingsModal,
  actionsHolder: AboutBlankSettings | ContentOfGroup,
  save: boolean,
  cssClass: string | null = null,
  headerName: string | null = null,
  headerDesc: string | null = null,
): void => {
  if (typeof headerName === "string" && !isFalsyString(headerName)) {
    const headerItem = new Setting(elem);
    if (typeof cssClass === "string" && !isFalsyString(cssClass)) {
      headerItem.setClass(cssClass);
    }
    headerItem.setName(headerName).setHeading();
  }

  const descItem = new Setting(elem);
  if (typeof cssClass === "string" && !isFalsyString(cssClass)) {
    descItem.setClass(cssClass);
  }
  if (typeof headerDesc === "string" && !isFalsyString(headerDesc)) {
    descItem.setDesc(headerDesc);
  }
  descItem
    .addText((text) => {
      text
        .setPlaceholder("New action's name...")
        .setValue(page.newActionName)
        .onChange((value) => {
          try {
            page.newActionName = value;
          } catch (error) {
            loggerOnError(error, "Error in settings.\n(About Blank)");
          }
        });
    })
    .addExtraButton((button) => {
      button
        .setIcon("plus")
        .setTooltip("Create")
        .onClick(async () => {
          try {
            const newAction = await createNewAction(
              page.app,
              page.newActionName,
            );
            if (newAction === undefined) {
              return;
            }
            actionsHolder.actions.push(newAction);
            if (save) {
              await page.plugin.saveSettings();
              if (page.plugin.settings.quickActions === true) {
                page.plugin.registerQuickActions(); // Overwrite
              }
            }
            // page.newActionName = "";
            page.display();
          } catch (error) {
            loggerOnError(error, "Error in settings.\n(About Blank)");
          }
        });
      setFakeIconToExButtonIfEmpty(button.extraSettingsEl);
    });
};

export const makeSettingsActionsList = (
  elem: HTMLElement,
  page: AboutBlankSettingTab | ActionSettingsModal,
  nextPageIndex: number,
  actionsHolder: AboutBlankSettings | ContentOfGroup,
  save: boolean,
  parentsDisplay?: boolean,
): void => {
  actionsHolder.actions.forEach((action, index) => {
    const settingItem = new Setting(elem);

    settingItem.setName(action.name);

    if (typeof action.icon === "string" && !isFalsyString(action.icon)) {
      const actionIconEl = settingItem.controlEl.createEl("div", {
        cls: CSS_CLASSES.actionIconText,
      });
      setIcon(actionIconEl, action.icon);
      setFakeIconToIconText(actionIconEl);
    }

    if (!page.switchInfo) {
      const kindIconEl = settingItem.controlEl.createEl("div", {
        cls: CSS_CLASSES.iconText,
      });
      setIcon(kindIconEl, ACTION_KINDS_ICON[action.content.kind]);

      const contentText: string = (() => {
        if (action.content.kind === ACTION_KINDS.command) {
          return `${action.content.commandName}`;
        } else if (action.content.kind === ACTION_KINDS.file) {
          return `${action.content.fileName}`;
        } else if (action.content.kind === ACTION_KINDS.group) {
          return `${action.content.actions.length} actions`;
        }
        return "";
      })();

      settingItem
        .addText((text) => {
          text
            .setDisabled(true)
            .setValue(contentText);
        });
    } else {
      Object.keys(ACTION_INFO_ICON).forEach((key: keyof Action) => {
        if (key !== "display" || nextPageIndex === 0) {
          const iconEl = settingItem.controlEl.createEl("div", {
            cls: CSS_CLASSES.iconText,
          });
          setIcon(iconEl, ACTION_INFO_ICON[key] ?? "");
          setFakeIconToIconText(iconEl);
          if (action[key] === true) { // Explicitly true
            iconEl.classList.add(CSS_CLASSES.ctaIcon);
          }
        }
      });
    }

    settingItem
      .addExtraButton((button) => {
        button
          .setIcon("arrow-up")
          .setTooltip("Up")
          .onClick(async () => {
            try {
              actionsHolder.actions = moveAction(
                actionsHolder.actions,
                index,
                -1,
              );
              if (save) {
                await page.plugin.saveSettings();
                if (page.plugin.settings.quickActions === true) {
                  page.plugin.registerQuickActions(); // Overwrite
                }
              }
              page.display();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
        setFakeIconToExButtonIfEmpty(button.extraSettingsEl);
      })
      .addExtraButton((button) => {
        button
          .setIcon("arrow-down")
          .setTooltip("Down")
          .onClick(async () => {
            try {
              actionsHolder.actions = moveAction(
                actionsHolder.actions,
                index,
                1,
              );
              if (save) {
                await page.plugin.saveSettings();
                if (page.plugin.settings.quickActions === true) {
                  page.plugin.registerQuickActions(); // Overwrite
                }
              }
              page.display();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
        setFakeIconToExButtonIfEmpty(button.extraSettingsEl);
      })
      .addExtraButton((button) => {
        button
          .setIcon("settings")
          .setTooltip("Edit")
          .onClick(() => {
            try {
              new ActionSettingsModal(
                page.app,
                page.plugin,
                page,
                nextPageIndex,
                actionsHolder,
                index,
                parentsDisplay,
              ).open();
            } catch (error) {
              loggerOnError(error, "Error in settings.\n(About Blank)");
            }
          });
        setFakeIconToExButtonIfEmpty(button.extraSettingsEl);
        button.extraSettingsEl.classList.add(CSS_CLASSES.iconHeightAdjuster);
      });
  });

  new Setting(elem)
    .addButton((button) => {
      button
        .setButtonText("Switch info")
        .setTooltip("Switch the action's information to be displayed")
        .onClick(() => {
          try {
            page.switchInfo = !page.switchInfo;
            page.display();
          } catch (error) {
            loggerOnError(error, "Error in settings.\n(About Blank)");
          }
        });
    });
};
