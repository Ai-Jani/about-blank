export const LOOP_MAX = 100;

export const COMMANDS = {
  quickActions: {
    id: "quick-actions",
    name: "Quick actions",
  },
} as const;

export const CSS_CLASSES = {
  aboutBlankContainer: "about-blank-button-container",
  aboutBlank: "about-blank-button",
  visible: "about-blank-visible",
  ctaExButton: "about-blank-cta-ex-button",
  iconText: "about-blank-icon-text",
  actionIconText: "about-blank-action-icon-text",
  ctaIcon: "about-blank-cta-icon",
  fakeExButton: "about-blank-fake-ex-button",
  fakeIcon: "about-blank-fake-icon",
  iconHeightAdjuster: "about-blank-icon-height-adjuster",
  settingActionHeader: "about-blank-setting-action-header",
  settingActionContent: "about-blank-setting-action-content",
  settingActionContentGroup: "about-blank-setting-action-content-group",
  settingActionSaveNotice: "about-blank-setting-action-save-notice",
} as const;

export const CSS_VARS = {
  emptyStateDisplay: "--about-blank-empty-state-display",
  defaultDisplayValue: "block",
  iconTextGap: "--about-blank-icon-text-gap",
} as const;
