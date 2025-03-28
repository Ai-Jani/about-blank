import {
  type App,
  setIcon,
  SuggestModal,
} from "obsidian";

import {
  loggerOnError,
} from "src/commons";

// =============================================================================

interface Execution {
  icon: string;
  name: string;
  callback: () => Promise<void> | void;
}

// =============================================================================

export class ExecutionSuggester extends SuggestModal<Execution> {
  executions: Execution[];
  suggestionCssClass: string;

  constructor(
    app: App,
    executions: Execution[],
    placeholder: string | null = null,
    suggestionCssClass: string = "mod-complex",
  ) {
    super(app);
    this.executions = executions;
    if (typeof placeholder === "string") {
      this.setPlaceholder(placeholder);
    }
    this.suggestionCssClass = suggestionCssClass;
  }

  // If separated by spaces, the search will be performed using "AND" conditions.
  getSuggestions(query: string): Execution[] {
    try {
      const splitQueries = query.trim().split(" ");
      return this.executions.filter((execution) => {
        return splitQueries.every((splitQuery) => {
          return execution.name.toLowerCase().includes(splitQuery.toLowerCase());
        });
      });
    } catch (error) {
      loggerOnError(error, "Failled to get suggestions.");
      return [];
    }
  }

  renderSuggestion(execution: Execution, elem: HTMLElement) {
    try {
      elem.classList.add(this.suggestionCssClass);
      elem.createEl("div", { text: execution.name });
      setIcon(elem.createEl("div"), execution.icon);
    } catch (error) {
      loggerOnError(error, "Failled to render suggestion.");
    }
  }

  onChooseSuggestion(execution: Execution, event: MouseEvent | KeyboardEvent) {
    try {
      void execution.callback();
    } catch (error) {
      loggerOnError(error, "Failled to select suggestion.");
    }
  }
}
