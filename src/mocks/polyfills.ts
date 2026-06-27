/**
 * MSW polyfills for React Native (Hermes engine).
 *
 * MSW 2.x internally uses browser globals that Hermes doesn't provide.
 * We patch them onto `global` before calling setupServer() / server.listen().
 *
 * Required:
 *   - fast-text-encoding        → TextEncoder / TextDecoder
 *   - react-native-url-polyfill → URL / URLSearchParams
 *   - Manual stubs              → MessageEvent, Event, EventTarget, BroadcastChannel
 */

import "fast-text-encoding";
import "react-native-url-polyfill/auto";

// Globals required by msw/native's internal event bus
const MISSING_GLOBALS = [
  "MessageEvent",
  "Event",
  "EventTarget",
  "BroadcastChannel",
] as const;

MISSING_GLOBALS.forEach((name) => {
  if (typeof (global as Record<string, unknown>)[name] === "undefined") {
    // @ts-expect-error — patching missing browser APIs onto React Native global
    global[name] = class {
      type: string;
      data: unknown;
      constructor(type: string, init?: Record<string, unknown>) {
        this.type = type;
        if (init) Object.assign(this, init);
      }
    };
  }
});

// Polyfill Response.prototype.body to support MSW v2 request interception on React Native.
// React Native's whatwg-fetch does not expose a standard .body getter, causing MSW to return empty responses.
if (
  typeof global.Response !== "undefined" &&
  !Object.getOwnPropertyDescriptor(global.Response.prototype, "body")
) {
  Object.defineProperty(global.Response.prototype, "body", {
    get() {
      // @ts-expect-error — accessing React Native's internal fetch body representation
      const text = this._bodyText;
      return text != null ? text : null;
    },
    configurable: true,
  });
}
