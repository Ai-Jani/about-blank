import {
  type App,
  type ButtonComponent,
  Modal,
  Notice,
  Setting,
} from "obsidian";

// =============================================================================

/* Example:
try {
  const response = await new ConfirmDialogAsync(
    this.app,
    "Execute command",
    "Are you sure you want to execute the command?",
  ).setOkCancel().openAndRespond();
  if (!response.result) {
    return;
  }
} catch (error) {
  console.error(error);
}
*/

// =============================================================================

interface DialogResponse {
  result: boolean;
  aborted: boolean;
}

interface ButtonSettings {
  text: string;
  cta?: boolean;
  warn?: boolean;
}

// =============================================================================

export class ConfirmDialogAsync extends Modal {
  contentContainer: Setting;
  buttonsContainer: Setting;
  response: Promise<DialogResponse>;
  resolve: (resolution: DialogResponse) => void;

  abortedResponse: DialogResponse = {
    result: false,
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
    title: string | null = null,
    content: string | null = null,
    positiveButton: string | ButtonSettings | null = null,
    negativeButton: string | ButtonSettings | null = null,
  ) {
    super(app);
    this.response = new Promise((resolve) => {
      this.resolve = resolve;
    });
    if (typeof title === "string") {
      this.setTitle(title);
    }
    this.contentContainer = new Setting(this.contentEl);
    this.setContentText(content);
    this.buttonsContainer = new Setting(this.contentEl);
    this.setButtons(positiveButton, negativeButton);
  }

  setContentText = (content: string | null) => {
    if (typeof content === "string") {
      this.contentContainer.setName(content);
    }
  };

  setButtons = (
    positiveButton: string | ButtonSettings | null,
    negativeButton: string | ButtonSettings | null,
  ) => {
    if (positiveButton === null && negativeButton === null) {
      return;
    }
    const pButton: ButtonSettings | null = typeof positiveButton === "string"
      ? { text: positiveButton }
      : positiveButton;
    const nButton: ButtonSettings | null = typeof negativeButton === "string"
      ? { text: negativeButton }
      : negativeButton;
    this.buttonsContainer.clear();
    if (pButton !== null) {
      this.buttonsContainer.addButton(this.addButtonCallback(pButton, true));
    }
    if (nButton !== null) {
      this.buttonsContainer.addButton(this.addButtonCallback(nButton, false));
    }
  };

  private addButtonCallback = (
    buttonSettings: ButtonSettings,
    result: boolean,
  ) => {
    return (button: ButtonComponent) => {
      button
        .setButtonText(buttonSettings.text)
        .onClick(() => {
          try {
            this.resolve({
              result,
              aborted: false,
            });
            this.close();
          } catch (error) {
            this.errorHandler(error, "Error in button callback");
          }
        });
      if (buttonSettings.cta) {
        button.setCta();
      }
      if (buttonSettings.warn) {
        button.setWarning();
      }
    };
  };

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
      this.errorHandler(error, "Error when closing dialog.");
    }
  }

  setOk = () => {
    this.setButtons(
      {
        text: "OK",
        cta: true,
      },
      null,
    );
    return this;
  };

  setOkCancel = () => {
    this.setButtons(
      {
        text: "OK",
        cta: true,
      },
      "Cancel",
    );
    return this;
  };

  setYesNo = () => {
    this.setButtons(
      {
        text: "Yes",
        cta: true,
      },
      "No",
    );
    return this;
  };

  setDeleteCancel = () => {
    this.setButtons(
      {
        text: "Delete",
        warn: true,
      },
      "Cancel",
    );
    return this;
  };
}
