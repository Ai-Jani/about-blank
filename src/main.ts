import {
  type Command,
  Notice,
  Plugin,
  setIcon,
} from "obsidian";

import {
  type Action,
  ACTION_KINDS,
  actionPropTypeCheck,
  groupingActions,
  NEW_ACTION,
  newActionClone,
  type PracticalAction,
  toPracticalAction,
} from "src/settings/action";

import {
  HIDE_DEFAULT_ACTIONS,
} from "src/settings/hideDefault";

import {
  type AboutBlankSettings,
  AboutBlankSettingTab,
  DEFAULT_SETTINGS,
  defaultSettingsClone,
  settingsPropTypeCheck,
} from "src/settings/settingTab";

import hasClassElements from "src/utils/hasClassElements";

import hasDuplicates from "./utils/hasDuplicates";

import isFalsyString from "src/utils/isFalsyString";

import isPlainObject from "src/utils/isPlainObject";

import loggerOnError from "src/utils/loggerOnError";

import updateProp from "src/utils/updateProp";

import {
  allActionsBloodline,
  genNewCmdId,
} from "src/commons";

import {
  COMMANDS,
  CSS_CLASSES,
  CSS_VARS,
} from "src/constants";

import {
  UNSAFE_CSS_CLASSES,
  UNSAFE_EMPTY_PROPS,
  UNSAFE_VIEW_TYPES,
  UnsafeEmptyActionListEl,
  type UnsafeEmptyView,
} from "src/unsafe";

// =============================================================================

export default class AboutBlank extends Plugin {
  settings: AboutBlankSettings;
  needToResisterActions: boolean;
  needToRemoveActions: boolean;
  needToResisterQuickActions: boolean;

  async onload() {
    try {
      await this.loadSettingsShallow();
      this.app.workspace.onLayoutReady(this.lazyLoad);

      if (this.settings.addActionsToNewTabs) {
        this.registerEvent(
          this.app.workspace.on("layout-change", this.addButtonsIfNewTab),
        );
      } else {
        document.documentElement.style.setProperty(
          CSS_VARS.emptyStateDisplay,
          CSS_VARS.defaultDisplayValue,
        );
      }

      this.addSettingTab(new AboutBlankSettingTab(this.app, this));
    } catch (error) {
      loggerOnError(error, "Failed to load plugin.\n(About Blank)");
    }
  }

  lazyLoad = async () => {
    try {
      await this.loadSettingsDeep();
      const allActions = allActionsBloodline(this.settings.actions);
      const hasCommandsToRegister = allActions.some((action) => {
        return action.cmd === true; // Explicitly true
      });
      if (hasCommandsToRegister) {
        this.registerAllCmdToObsidian(allActions);
      }
      if (this.settings.quickActions) {
        this.registerQuickActions();
      }
    } catch (error) {
      loggerOnError(error, "Failed to load settings.\n(About Blank)");
    }
  };

  onunload() {}

  // ---------------------------------------------------------------------------

  loadSettingsShallow = async () => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as AboutBlankSettings;
  };

  loadSettingsDeep = async () => {
    this.settings = Object.assign({}, defaultSettingsClone(), await this.loadData()) as AboutBlankSettings;
  };

  saveSettings = async () => {
    await this.saveData(this.settings);
  };

  // ---------------------------------------------------------------------------

  registerCmdToObsidian = (action: PracticalAction): void => {
    if (typeof action.cmdId !== "string" || typeof action.name !== "string") {
      new Notice("Failed to register a command.\n(About Blank)");
      console.warn("About Blank: Failed to register a command.", action);
      return;
    }

    const commandConfig: Command = {
      id: action.cmdId,
      name: action.name,
      callback: action.callback,
    };
    if (typeof action.icon === "string" && !isFalsyString(action.icon)) {
      commandConfig.icon = action.icon;
    }
    this.addCommand(commandConfig);
  };

  registerAllCmdToObsidian = (allActions?: Action[]): void => {
    if (allActions === undefined) {
      allActions = allActionsBloodline(this.settings.actions);
    }
    const registerActions = allActions.filter((action) => {
      // Explicitly true
      return action.cmd === true;
    });
    const practicalActions: PracticalAction[] = registerActions
      .map((action) => {
        return toPracticalAction(this.app, action);
      })
      .filter((action) => action !== undefined);

    practicalActions.forEach((action) => {
      this.registerCmdToObsidian(action);
    });
  };

  // Prerequisites for correct behavior:
  // - No change in `cmdId` for the same action.
  // - No duplicate `cmdIds`.
  // However, since it works fine with Obsidian reload, it's not something absolutely have to avoid.
  // The arguments are the return value of the `allActionsBloodline()`.
  removeApplicableCmds = (allOriginalActions: Action[], allModifiedActions: Action[]): void => {
    const cmdOrgActions = allOriginalActions.filter((action) => action.cmd ? true : false); // Safe side
    const orgCmdIds = cmdOrgActions.map((action) => action.cmdId);

    const cmdModActions = allModifiedActions.filter((action) => action.cmd === true); // Safe side
    const modCmdIds = cmdModActions.map((action) => action.cmdId);

    // Consider deleting or creating new actions, and think based on the Original.
    const shouldRemoveCmdIds = orgCmdIds.filter((cmdId) => !modCmdIds.includes(cmdId));
    shouldRemoveCmdIds.forEach((cmdId) => this.removeCommand(cmdId));
  };

  registerQuickActions = (): void => {
    const registerAction = groupingActions(
      this.app,
      {
        icon: this.settings.quickActionsIcon,
        name: COMMANDS.quickActions.name,
        cmd: true,
        cmdId: COMMANDS.quickActions.id,
      },
      this.settings.actions.filter((action) => action.display === true),
      "About Blank: Quick Actions",
    );
    if (registerAction === undefined) {
      return;
    }
    this.registerCmdToObsidian(registerAction);
  };

  unregisterQuickActions = (): void => {
    this.removeCommand(COMMANDS.quickActions.id);
  };

  // ---------------------------------------------------------------------------

  private addButtonsIfNewTab = (): void => {
    try {
      if (!this.settings.addActionsToNewTabs) {
        return;
      }
      const leaf = this.app.workspace.getMostRecentLeaf();
      if (leaf?.view?.getViewType() !== UNSAFE_VIEW_TYPES.empty) {
        return;
      }
      const emptyActionListEl =
        (leaf.view as UnsafeEmptyView)[UNSAFE_EMPTY_PROPS.emptyActionListEl] as UnsafeEmptyActionListEl;
      const emptyTitleEl = (leaf.view as UnsafeEmptyView)[UNSAFE_EMPTY_PROPS.emptyTitleEL] as HTMLDivElement;
      // Expect: emptyActionListEl has `children` (HTMLCollection).
      const childElements = emptyActionListEl
        ? Array.from(emptyActionListEl.children) as HTMLElement[]
        : null;
      this.applyVisibleClass(emptyTitleEl, childElements);
      // Additional actions by "About Blank"
      if (!emptyActionListEl || !childElements) {
        return;
      }
      if (this.alreadyAdded(childElements)) {
        return;
      }
      const practicalActions: PracticalAction[] = this.settings.actions
        .filter((action) => action.display === true) // Explicitly true
        .map((action) => toPracticalAction(this.app, action))
        .filter((action) => action !== undefined);
      // Expect: emptyActionListEl has `createEl()` method.
      practicalActions.forEach((action) => this.addActionButton(emptyActionListEl, action));
    } catch (error) {
      loggerOnError(error, "Failed to add buttons in New Tab.\n(About Blank)");
    }
  };

  private applyVisibleClass = (messageEl: HTMLElement | null, actionEls: HTMLElement[] | null): void => {
    const messageIsTarget = messageEl && !this.settings.hideMessage
      && !messageEl.classList.contains(CSS_CLASSES.visible);
    if (messageIsTarget) {
      messageEl.classList.add(CSS_CLASSES.visible);
    }

    if (!actionEls) {
      return;
    }
    if (this.settings.hideDefaultActions === HIDE_DEFAULT_ACTIONS.all) {
      return;
    }
    if (this.settings.hideDefaultActions === HIDE_DEFAULT_ACTIONS.close) {
      actionEls = actionEls.filter((elem) => {
        return !elem.classList.contains(UNSAFE_CSS_CLASSES.defaultCloseAction);
      });
    }
    actionEls.map((elem) => {
      if (elem.classList.contains(CSS_CLASSES.visible)) {
        return;
      }
      elem.classList.add(CSS_CLASSES.visible);
    });
  };

  private alreadyAdded = (elements: HTMLElement[]): boolean => {
    const classesToAdd = [
      CSS_CLASSES.aboutBlankContainer,
      CSS_CLASSES.aboutBlank,
    ];
    return classesToAdd.some((className) => hasClassElements(elements, className));
  };

  private addActionButton = (element: HTMLElement, action: PracticalAction): void => {
    const container = element.createEl(
      "div",
      {
        cls: `${UNSAFE_CSS_CLASSES.defaultEmptyAction} ${CSS_CLASSES.visible} ${CSS_CLASSES.aboutBlankContainer}`,
      },
      (elem: Element) => {
        elem.addEventListener("click", () => {
          void action.callback();
        });
      },
    );
    if (!isFalsyString(action.icon)) {
      setIcon(container, action.icon);
    }
    container.createEl(
      "div",
      {
        cls: `${CSS_CLASSES.visible} ${CSS_CLASSES.aboutBlank}`,
        text: `${action.name}`,
      },
    );
  };

  // ---------------------------------------------------------------------------

  cleanUpSettings = (): void => {
    const normalizeResults = this.normalizeSettings();
    const allActions = allActionsBloodline(this.settings.actions);
    const fixResults = this.checkFixAllCmd(allActions);
    const isRegisterable = this.isRegisterable(null, allActions);
    if (isRegisterable) {
      this.registerAllCmdToObsidian(allActions);
      if (this.settings.quickActions === true) {
        this.registerQuickActions();
      }
    }
    const results = [...normalizeResults, ...fixResults];
    if (0 < results.length || !isRegisterable) {
      const registerableResult = isRegisterable ? "OK" : "Failed";
      const resultsMessage =
        `"Type/Properties check": ${normalizeResults.length} fixed\n"Command IDs check": ${fixResults.length} fixed\n"Register all commands": ${registerableResult}`;
      const descMessage =
        "Check the console for more details. Settings not yet saved, reload Obsidian to discard changes.";
      new Notice(`${resultsMessage}\n\n${descMessage}\n\n**Click to close**`, 0);
      console.log(...normalizeResults, ...fixResults);
      return;
    }
    new Notice("No settings error found");
  };

  normalizeSettings = (): unknown[] => {
    const results: unknown[] = [];

    const normalizeActions = (actions: Action[]): Action[] => {
      return actions.map((action) => {
        if (!isPlainObject(action)) {
          const newAction = newActionClone();
          results.push(
            new Map<string, unknown>([
              ["errorType", "action itself type error"],
              ["before", action],
              ["after", newAction],
            ]),
          );
          return newAction;
        }
        const actionKeys = Object.keys(NEW_ACTION) as Array<keyof Action>;
        actionKeys.forEach((key) => {
          if (!actionPropTypeCheck[key](action[key])) {
            const newAction = newActionClone();
            results.push(
              new Map<string, unknown>([
                ["errorType", "action's property type error"],
                ["actionName", action.name],
                ["actionCommandId", action.cmdId],
                ["actionContentKind", action.content.kind],
                ["actionContent", action.content],
                ["fixedKey", key],
                ["before", action[key]],
                ["after", newAction[key]],
              ]),
            );
            updateProp(action, key, newAction[key]);
          }
        });
        if (action.content.kind === ACTION_KINDS.group) {
          action.content.actions = normalizeActions(action.content.actions);
        }
        return action;
      });
    };

    const defaultSettings = defaultSettingsClone();
    const settingsKeys = Object.keys(defaultSettings) as Array<keyof AboutBlankSettings>;
    settingsKeys.forEach((key) => {
      if (!settingsPropTypeCheck[key](this.settings[key])) {
        results.push(
          new Map<string, unknown>([
            ["errorType", "settings property type error"],
            ["fixedKey", key],
            ["before", this.settings[key]],
            ["after", defaultSettings[key]],
          ]),
        );
        updateProp(this.settings, key, defaultSettings[key]);
      }
    });

    this.settings.actions = normalizeActions(this.settings.actions);

    return results;
  };

  // Expect: `this.normalizeSettings()` was done.
  checkFixAllCmd = (allActions?: Action[]): unknown[] => {
    if (!Array.isArray(allActions)) {
      allActions = allActionsBloodline(this.settings.actions);
    }

    const fixResults: unknown[] = [];
    for (const action of allActions) {
      if (isFalsyString(action.cmdId)) {
        const beforeId = action.cmdId;
        action.cmdId = genNewCmdId(this.settings); // Unique ID
        fixResults.push(
          new Map<string, unknown>([
            ["errorType", "action's command ID is falsy string"],
            ["actionName", action.name],
            ["actionContentKind", action.content.kind],
            ["actionContent", action.content],
            ["beforeId", beforeId],
            ["fixedId", action.cmdId],
          ]),
        );
      }
    }

    if (hasDuplicates(allActions.map((action) => action.cmdId))) {
      const resolveResults: unknown[] = this.resolveCmdIdsConflict(allActions);
      return [...fixResults, ...resolveResults];
    }

    return fixResults;
  };

  // Before executing this, check for duplicates with `hasDuplicates.ts`
  // Expect: `this.normalizeSettings()` was done.
  resolveCmdIdsConflict = (allActions?: Action[]): unknown[] => {
    if (!Array.isArray(allActions)) {
      allActions = allActionsBloodline(this.settings.actions);
    }

    const results: unknown[] = [];
    const cmdIds = allActions.map((action) => action.cmdId);
    cmdIds.forEach((cmdId, index) => {
      const duplicate = cmdIds.indexOf(cmdId, index + 1);
      if (duplicate !== -1) {
        // In the current algorithm, if there are multiple duplicates,
        // it is better to update the `index` ID rather than `duplicate`.
        const action = allActions[index];
        const beforeId = action.cmdId;
        action.cmdId = genNewCmdId(this.settings); // Unique ID
        results.push(
          new Map<string, unknown>([
            ["errorType", "action's command ID is duplicated"],
            ["actionName", action.name],
            ["actionContentKind", action.content.kind],
            ["actionContent", action.content],
            ["beforeId", beforeId],
            ["fixedId", action.cmdId],
          ]),
        );
      }
    });

    return results;
  };

  isRegisterable = (
    registerId: string | null = null,
    allActions?: Action[],
  ): boolean => {
    if (!Array.isArray(allActions)) {
      allActions = allActionsBloodline(this.settings.actions);
    }

    const cmdIds = allActions.map((action) => action.cmdId);
    if (typeof registerId === "string") {
      return !isFalsyString(registerId) && !hasDuplicates(cmdIds, registerId);
    } else {
      return cmdIds.every((cmdId) => !isFalsyString(cmdId)) && !hasDuplicates(cmdIds);
    }
  };
}
