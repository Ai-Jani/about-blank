/**
 * =============================================================================
 *       ** Limited to rewriting CSS variables specific to About Blank **
 * =============================================================================
 */

import {
  CSS_VARS,
} from "src/constants";

// =============================================================================

export const editStyles = {
  rewriteCssVars: {
    emptyStateDisplay: {
      default: (): void => {
        document.documentElement.style.setProperty(
          CSS_VARS.emptyStateDisplay.name,
          CSS_VARS.emptyStateDisplay.value.default,
        );
      },
      hide: (): void => {
        document.documentElement.style.removeProperty(CSS_VARS.emptyStateDisplay.name);
      },
    },
    iconTextGap: {
      default: (): void => {
        document.documentElement.style.removeProperty(CSS_VARS.iconTextGap.name);
      },
      set: (value: number): void => {
        document.documentElement.style.setProperty(
          CSS_VARS.iconTextGap.name,
          `${value}px`,
        );
      },
    },
    emptyStateContainerMaxHeight: {
      default: (): void => {
        document.documentElement.style.removeProperty(CSS_VARS.emptyStateContainerMaxHeight.name);
      },
      centered: (): void => {
        document.documentElement.style.setProperty(
          CSS_VARS.emptyStateContainerMaxHeight.name,
          CSS_VARS.emptyStateContainerMaxHeight.value.centered,
        );
      },
    },
    emptyStateListMarginTop: {
      default: (): void => {
        document.documentElement.style.removeProperty(CSS_VARS.emptyStateListMarginTop.name);
        document.documentElement.style.removeProperty(CSS_VARS.emptyStateListMarginTopMobile.name);
      },
      centered: (): void => {
        document.documentElement.style.setProperty(
          CSS_VARS.emptyStateListMarginTop.name,
          CSS_VARS.emptyStateListMarginTop.value.centered,
        );
        document.documentElement.style.setProperty(
          CSS_VARS.emptyStateListMarginTopMobile.name,
          CSS_VARS.emptyStateListMarginTopMobile.value.centered,
        );
      },
    },
  },
};
