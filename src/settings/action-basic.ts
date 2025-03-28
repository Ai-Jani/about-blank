import {
  type App,
} from "obsidian";

import {
  v4 as uuidv4,
} from "uuid";

import {
  chooseKindAndContent,
} from "src/settings/action-settings";

import {
  type AboutBlankSettings,
  DEFAULT_SETTINGS,
  settingsPropTypeCheck,
} from "src/settings/settingTab";

import isBool from "src/utils/isBool";

import isFalsyString from "src/utils/isFalsyString";

import {
  objectDeepCopy,
} from "src/utils/objectDeepCopy";

import {
  LOOP_MAX,
} from "src/constants";

import {
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
