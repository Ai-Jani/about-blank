import {
  Notice,
} from "obsidian";

export default (
  error: any,
  noticeMessage: string = "",
  noticeDuration: number | undefined = undefined,
) => {
  if (!Number.isFinite(noticeDuration)) {
    noticeDuration = undefined;
  }
  if (typeof noticeMessage === "string" && 0 < noticeMessage.length) {
    new Notice(noticeMessage, noticeDuration);
  }
  const errorObj: Error = error instanceof Error
    ? error
    : new Error(String(error));
  console.error("Error on About Blank:", errorObj);
};
