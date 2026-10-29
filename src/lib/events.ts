import { EventEmitter } from "events";

declare global {
  var appEventBus: EventEmitter | undefined;
}

export const eventBus = globalThis.appEventBus || new EventEmitter();
eventBus.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalThis.appEventBus = eventBus;
}

export type AppEvent =
  | { type: "ISSUE_UPDATED"; issueId: string; projectKey?: string; field?: string }
  | { type: "ISSUE_CREATED"; issueId: string; projectKey?: string }
  | { type: "COMMENT_ADDED"; issueId: string; commentId: string };

export function emitAppEvent(event: AppEvent) {
  eventBus.emit("app-event", event);
}
