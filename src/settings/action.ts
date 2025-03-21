import {
  type App,
  normalizePath,
  Notice,
  setIcon,
  Setting,
  type TFile,
} from "obsidian";

import {
  ActionSettingsModal,
} from "src/settings/actionSettingsModal";

import {
  type AboutBlankSettings,
  type AboutBlankSettingTab,
  DEFAULT_SETTINGS,
  settingsPropTypeCheck,
} from "src/settings/settingTab";

import {
  ConfirmDialogAsync,
} from "src/ui/confirmDialogAsync";

import {
  ExecutionSuggester,
} from "src/ui/executionSuggester";

import {
  StringSuggesterAsync,
} from "src/ui/stringSuggesterAsync";

import isBool from "src/utils/isBool";

import isFalsyString from "src/utils/isFalsyString";

import loggerOnError from "src/utils/loggerOnError";

import moveItemInArray from "src/utils/moveItemInArray";

import {
  objectDeepCopy,
} from "src/utils/objectDeepCopy";

import {
  genNewCmdId,
  setFakeIconToExButtonIfEmpty,
  setFakeIconToIconText,
} from "src/commons";

import {
  CSS_CLASSES,
  UNSAFE_PROPERTIES,
} from "src/constants";

import {
  type UnsafeApp,
  type ValuesOf,
} from "src/types";

// =============================================================================

export const ACTION_KINDS = {
  command: "command",
  file: "file",
  group: "group",
} as const;

export const ACTION_KINDS_NAME: {
  [key in ValuesOf<typeof ACTION_KINDS>]: string;
} = {
  command: "Command",
  file: "File",
  group: "Group",
} as const;

export const ACTION_KINDS_ICON: {
  [key in ValuesOf<typeof ACTION_KINDS>]: string;
} = {
  command: "terminal",
  file: "file-text",
  group: "group",
} as const;

export interface ContentOfCommand {
  kind: typeof ACTION_KINDS.command;
  commandName: string;
  commandId: string;
}

export interface ContentOfFile {
  kind: typeof ACTION_KINDS.file;
  fileName: string;
  filePath: string;
}

export interface ContentOfGroup {
  kind: typeof ACTION_KINDS.group;
  actions: Action[];
}

export type ContentType = ContentOfCommand | ContentOfFile | ContentOfGroup;

export const NEW_ACTION_CONTENT: {
  [ACTION_KINDS.command]: ContentOfCommand;
  [ACTION_KINDS.file]: ContentOfFile;
  [ACTION_KINDS.group]: ContentOfGroup;
} = {
  command: {
    kind: ACTION_KINDS.command,
    commandName: "",
    commandId: "",
  },
  file: {
    kind: ACTION_KINDS.file,
    fileName: "",
    filePath: "",
  },
  group: {
    kind: ACTION_KINDS.group,
    actions: DEFAULT_SETTINGS.actions,
  },
} as const;

export interface Action {
  icon: string;
  name: string;
  ask: boolean;
  cmd: boolean;
  cmdId: string;
  display: boolean;
  content: ContentType;
}

export const NEW_ACTION: Action = {
  icon: "",
  name: "",
  ask: false,
  cmd: false,
  cmdId: "",
  display: true,
  content: NEW_ACTION_CONTENT[ACTION_KINDS.command],
} as const;

export const ACTION_INFO_ICON: { [key in keyof Partial<Action>]: string; } = {
  ask: "message-circle-question",
  cmd: "square-terminal",
  display: "eye",
} as const;

// =============================================================================

export const actionPropTypeCheck: {
  [key in keyof Action]: (value: any) => boolean;
} = {
  icon: (value: any) => typeof value === "string",
  name: (value: any) => typeof value === "string",
  ask: (value: any) => isBool(value),
  cmd: (value: any) => isBool(value),
  cmdId: (value: any) => typeof value === "string",
  display: (value: any) => isBool(value),
  content: (value: any) => {
    const contentValue = value as ContentType;
    if (contentValue.kind === ACTION_KINDS.command) {
      const { commandName, commandId } = contentValue;
      return typeof commandName === "string" && typeof commandId === "string";
    } else if (contentValue.kind === ACTION_KINDS.file) {
      const { fileName, filePath } = contentValue;
      return typeof fileName === "string" && typeof filePath === "string";
    } else if (contentValue.kind === ACTION_KINDS.group) {
      return settingsPropTypeCheck.actions(contentValue.actions);
    }
    return false;
  },
};

// =============================================================================

export const newContentOfCommandClone = (): ContentOfCommand => {
  return objectDeepCopy(NEW_ACTION_CONTENT[ACTION_KINDS.command]);
};

export const newContentOfFileClone = (): ContentOfFile => {
  return objectDeepCopy(NEW_ACTION_CONTENT[ACTION_KINDS.file]);
};

export const newContentOfGroupClone = (): ContentOfGroup => {
  return objectDeepCopy(NEW_ACTION_CONTENT[ACTION_KINDS.group]);
};

export const newActionClone = (): Action => {
  return objectDeepCopy(NEW_ACTION);
};

// If omit the `settings` argument, it will simply return the UUID.
// If a `settings` is provided, it checks for duplicates and returns a unique ID.
export const createNewAction = async (
  app: App,
  newActionName: string,
  settings?: AboutBlankSettings,
): Promise<Action | void> => {
  if (isFalsyString(newActionName)) {
    return;
  }

  const content = await chooseKindAndContent(app);
  if (content === undefined) {
    return;
  }

  const newAction = newActionClone();
  newAction.name = newActionName;
  newAction.cmdId = genNewCmdId(settings);
  newAction.content = content;

  return newAction;
};

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
      const commands = (app as UnsafeApp)[UNSAFE_PROPERTIES.appCommands.parent];
      const commandsList = commands[UNSAFE_PROPERTIES.appCommands.commandsList];
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

export const moveAction = (
  actions: Action[],
  index: number,
  direction: -1 | 1,
): Action[] => {
  return moveItemInArray(
    actions,
    index,
    direction,
    true,
  );
};

// =============================================================================

export interface PracticalAction {
  icon: string;
  name: string;
  cmd: boolean;
  cmdId: string;
  callback: () => Promise<void> | void;
}

export const toPracticalAction = (
  app: App,
  action: Action,
): PracticalAction | void => {
  const unqualified = isFalsyString(action.name)
    || !Object.values(ACTION_KINDS).includes(action.content.kind);
  if (unqualified) {
    return;
  }
  if (action.content.kind === ACTION_KINDS.command) {
    const undefinedCommand = isFalsyString(action.content.commandName)
      || isFalsyString(action.content.commandId);
    if (undefinedCommand) {
      return;
    }
  } else if (action.content.kind === ACTION_KINDS.file) {
    const undefinedFile = isFalsyString(action.content.fileName)
      || isFalsyString(action.content.filePath);
    if (undefinedFile) {
      return;
    }
  }

  if (action.content.kind === ACTION_KINDS.group) {
    return groupingActions(
      app,
      action,
      action.content.actions,
      `${action.name}`, // Force to String
    );
  }

  const icon = typeof action.icon !== "string" || isFalsyString(action.icon)
    ? ""
    : action.icon;

  const callback: () => Promise<void> = (() => {
    if (action.content.kind === ACTION_KINDS.command) {
      return generateCommandCallback(app, action);
    } else if (action.content.kind === ACTION_KINDS.file) {
      return generateFileCallback(app, action);
    } else {
      return async () => {};
    }
  })();

  return {
    icon,
    name: `${action.name}`, // Force to String
    cmd: action.cmd === true, // Force to Boolean
    cmdId: `${action.cmdId}`, // Force to String
    callback,
  };
};

const generateCommandCallback = (
  app: App,
  action: Action,
): () => Promise<void> => {
  const { commandName, commandId } = action.content as ContentOfCommand;
  return async () => {
    try {
      if (action.ask === true) { // Explicitly true
        const cancel = await cancelExecute(
          app,
          `${action.name}`,
          `Execute command: ${commandName} (${commandId})`,
        );
        if (cancel) {
          return;
        }
      }

      const commands = (app as UnsafeApp)[UNSAFE_PROPERTIES.appCommands.parent];
      // Currently, `app.commands.commands.executeCommandById()` returns false
      // if the specified ID does not exist, and true if the execution is successful.
      const res: boolean = await commands[UNSAFE_PROPERTIES.appCommands.executeById](commandId);
      if (!res) {
        new Notice(`Failed to execute command: ${commandName} (${commandId})`);
      }
    } catch (error) {
      loggerOnError(error, "Failed to execute command.\n(About Blank)");
    }
  };
};

const generateFileCallback = (
  app: App,
  action: Action,
): () => Promise<void> => {
  const { fileName, filePath } = action.content as ContentOfFile;
  const normalizedPath = normalizePath(filePath);
  return async () => {
    try {
      if (action.ask === true) { // Explicitly true
        const cancel = await cancelExecute(
          app,
          `${action.name}`,
          `Open file: ${fileName} (${normalizedPath})`,
        );
        if (cancel) {
          return;
        }
      }

      // Prevent creating a new file.
      if (!app.vault.getFiles().map((file) => file.path).includes(normalizedPath)) {
        new Notice(`File not found: ${fileName} (${normalizedPath})`);
        return;
      }
      await app.workspace.openLinkText("", normalizedPath);
    } catch (error) {
      loggerOnError(error, "Failed to open file.\n(About Blank)");
    }
  };
};

const cancelExecute = async (
  app: App,
  title: string,
  message: string,
): Promise<boolean> => {
  const response = await new ConfirmDialogAsync(app, title, message).setOkCancel().openAndRespond();
  return !response.result;
};

// =============================================================================

export const groupingActions = (
  app: App,
  groupHolder: Partial<Action>,
  actions: Action[],
  placeholder: string | null = null,
): PracticalAction | void => {
  const { icon, name, cmd, cmdId } = groupHolder;

  const unqualified = isFalsyString(name);
  if (unqualified) {
    return;
  }
  const groupIcon = typeof icon !== "string" || isFalsyString(icon)
    ? ""
    : icon;

  const practicalActions: PracticalAction[] = actions
    .map((action) => toPracticalAction(app, action))
    .filter((action) => action !== undefined);
  const executions = practicalActions.map((action) => {
    const { icon, name, callback } = action;
    return { icon, name, callback };
  });

  const callback = (): void => {
    new ExecutionSuggester(app, executions, placeholder).open();
  };

  return {
    icon: groupIcon,
    name: `${name}`, // Force to String
    cmd: cmd === true, // Force to Boolean
    cmdId: `${cmdId}`, // Force to String
    callback,
  };
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
