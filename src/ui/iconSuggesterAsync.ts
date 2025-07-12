import {
  type App,
  Notice,
  setIcon,
  SuggestModal,
} from "obsidian";

// =============================================================================

/* Example:
import {
  getIconIds,
  setIcon,
} from "obsidian";

try {
  const iconIds = getIconIds();
  const response = await new IconSuggesterAsync(this.app, iconIds, "Icon...").openAndRespond();
  if (response.aborted) {
    return;
  }
  setIcon(element, response.result);
} catch (error) {
  console.error(error);
}
*/

// =============================================================================

type ValueType = string;

interface NormalResponse {
  result: ValueType;
  aborted: false;
}

interface AbortedResponse {
  result: null;
  aborted: true;
}

type SuggesterResponse = NormalResponse | AbortedResponse;

// =============================================================================

export class IconSuggesterAsync extends SuggestModal<ValueType> {
  icons: ValueType[];
  suggestionCssClass: string;
  response: Promise<SuggesterResponse>;
  resolve: (resolution: SuggesterResponse) => void;

  abortedResponse: AbortedResponse = {
    result: null,
    aborted: true,
  } as const;

  private errorHandler = (
    error: any,
    noticeMessage: string = "",
  ) => {
    if (typeof noticeMessage === "string" && 0 < noticeMessage.length) {
      new Notice(noticeMessage);
    }
    const errorObj: Error = error instanceof Error
      ? error
      : new Error(String(error));
    console.error(errorObj);
  };

  constructor(
    app: App,
    icons: ValueType[],
    placeholder: string | null = null,
    // title: string | null = null,
    suggestionCssClass: string = "mod-complex",
  ) {
    super(app);
    this.icons = icons;
    if (typeof placeholder === "string") {
      this.setPlaceholder(placeholder);
    }
    // if (typeof title === "string") {
    //   this.setTitle(title);
    // }
    this.suggestionCssClass = suggestionCssClass;
    this.response = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  openReturnThis = () => {
    this.open();
    return this;
  };

  openAndRespond = async () => {
    // Avoid `return await` for error handling.
    return this.openReturnThis().response;
  };

  onClose() {
    try {
      // If the operation is aborted or otherwise unresolved, resolve it with `abortedResponse`.
      this.resolve(this.abortedResponse);
    } catch (error) {
      this.errorHandler(error, "Error when closing suggester.");
    }
  }

  // If separated by spaces, the search will be performed using "AND" conditions.
  getSuggestions(query: string): ValueType[] {
    try {
      const splitQueries = query.trim().split(" ");
      return this.icons.filter((icon) => {
        return splitQueries.every((splitQuery) => {
          return icon.toLowerCase().includes(splitQuery.toLowerCase());
        });
      });
    } catch (error) {
      this.errorHandler(error, "Failed to get suggestions.");
      return [];
    }
  }

  renderSuggestion(icon: ValueType, elem: HTMLElement) {
    try {
      elem.classList.add(this.suggestionCssClass);
      elem.createEl("div", { text: icon });
      setIcon(elem.createEl("div"), icon);
    } catch (error) {
      this.errorHandler(error, "Failed to render suggestion.");
    }
  }

  // This is called after `this.close()`.
  // Use `selectSuggestion()` instead to resolve to a `defaultResult` in `onClose()`.
  onChooseSuggestion(icon: ValueType, event: MouseEvent | KeyboardEvent) {}

  // This usually calls `this.close()` and then `this.onChooseSuggestion()`.
  selectSuggestion(icon: ValueType, event: MouseEvent | KeyboardEvent) {
    try {
      // this.app.keymap.updateModifiers(event);
      this.resolve({
        result: icon,
        aborted: false,
      });
      this.close();
    } catch (error) {
      this.errorHandler(error, "Failed to select suggestion.");
    }
  }
}
