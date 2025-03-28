import {
  type App,
  normalizePath,
  Notice,
} from "obsidian";

import {
  type Action,
  ACTION_KINDS,
  type ContentOfCommand,
  type ContentOfFile,
} from "src/settings/action-basic";

import {
  ConfirmDialogAsync,
} from "src/ui/confirmDialogAsync";

import {
  ExecutionSuggester,
} from "src/ui/executionSuggester";

import isFalsyString from "src/utils/isFalsyString";

import loggerOnError from "src/utils/loggerOnError";

import moveItemInArray from "src/utils/moveItemInArray";

import {
  type UnsafeApp,
} from "src/unsafe";

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

  const basicCallback = async (): Promise<void> => {
    // Currently, `app.commands.commands.executeCommandById()` returns false
    // if the specified ID does not exist, and true if the execution is successful.
    const res: boolean = await (app as UnsafeApp).commands.executeCommandById(commandId);
    if (!res) {
      new Notice(`Failed to execute command: ${commandName} (${commandId})`);
    }
  };

  if (action.ask === true) { // Explicitly true
    return async (): Promise<void> => {
      try {
        const cancel = await cancelExecute(
          app,
          `${action.name}`,
          `Execute command: ${commandName} (${commandId})`,
        );
        if (cancel) {
          return;
        }
        await basicCallback();
      } catch (error) {
        loggerOnError(error, "Failed to execute command.\n(About Blank)");
      }
    };
  } else {
    return async (): Promise<void> => {
      try {
        await basicCallback();
      } catch (error) {
        loggerOnError(error, "Failed to execute command.\n(About Blank)");
      }
    };
  }
};

const generateFileCallback = (
  app: App,
  action: Action,
): () => Promise<void> => {
  const { fileName, filePath } = action.content as ContentOfFile;
  const normalizedPath = normalizePath(filePath);

  const basicCallback = async (): Promise<void> => {
    // Prevent creating a new file.
    if (!app.vault.getFiles().map((file) => file.path).includes(normalizedPath)) {
      new Notice(`File not found: ${fileName} (${normalizedPath})`);
      return;
    }
    await app.workspace.openLinkText("", normalizedPath);
  };

  if (action.ask === true) { // Explicitly true
    return async (): Promise<void> => {
      try {
        const cancel = await cancelExecute(
          app,
          `${action.name}`,
          `Open file: ${fileName} (${normalizedPath})`,
        );
        if (cancel) {
          return;
        }
        await basicCallback();
      } catch (error) {
        loggerOnError(error, "Failed to open file.\n(About Blank)");
      }
    };
  } else {
    return async (): Promise<void> => {
      try {
        await basicCallback();
      } catch (error) {
        loggerOnError(error, "Failed to open file.\n(About Blank)");
      }
    };
  }
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
