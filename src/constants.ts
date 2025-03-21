export const LOOP_MAX = 100;

export const COMMANDS = {
  quickActions: {
    id: "quick-actions",
    name: "Quick actions",
  },
} as const;

export const VIEW_TYPES = {
  empty: "empty", // unsafe
} as const;

export const CSS_CLASSES = {
  defaultEmptyAction: "empty-state-action tappable", // unsafe
  defaultCloseAction: "mod-close",
  aboutBlankContainer: "about-blank-button-container",
  aboutBlank: "about-blank-button",
  visible: "about-blank-visible",
  ctaExButton: "about-blank-cta-ex-button",
  fakeExButton: "about-blank-fake-ex-button",
  fakeIcon: "about-blank-fake-icon",
  iconText: "about-blank-icon-text",
  actionIconText: "about-blank-action-icon-text",
  ctaIcon: "about-blank-cta-icon",
  iconHeightAdjuster: "about-blank-icon-height-adjuster",
  settingActionHeader: "about-blank-setting-action-header",
  settingActionContent: "about-blank-setting-action-content",
  settingActionContentGroup: "about-blank-setting-action-content-group",
  settingActionSaveNotice: "about-blank-setting-action-save-notice",
} as const;

export const CSS_VARS = {
  emptyStateDisplay: "--about-blank-empty-state-display",
  defaultDisplayValue: "block",
} as const;

// Property (method) names that may change in the future.
export const UNSAFE_PROPERTIES = {
  // Property that `leaf.view` of `empty` should have.
  // This is an action list element (div.empty-state-action-list).
  emptyActionListEl: "actionListEl",
  // This is the element that displays the message (div.empty-state-title).
  emptyTitleEL: "emptyTitleEl",
  // `app.commands.commands` / `app.commands.executeCommandById()`
  appCommands: {
    parent: "commands",
    commandsList: "commands",
    executeById: "executeCommandById",
  },
} as const;
// Related: Unsafe*** in types.ts
