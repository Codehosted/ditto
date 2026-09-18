import { Window } from "happy-dom";

const window = new Window({ url: "http://localhost" });
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "SVGElement", "Event", "MouseEvent", "KeyboardEvent", "MutationObserver", "localStorage", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
  const value = key === "window" ? window : window[key];
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: ["getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"].includes(key)
      ? (value as Function).bind(window) : value,
  });
}
// Happy DOM's incomplete Web Animations implementation rejects canceled
// animations. Exercise Motion's real JS fallback instead (no component mocks).
Object.defineProperty(window.Element.prototype, "animate", { configurable: true, value: undefined });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
