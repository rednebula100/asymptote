import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

if (typeof globalThis.PointerEvent === "undefined") {
  Object.defineProperty(globalThis, "PointerEvent", {
    configurable: true,
    value: MouseEvent,
  });
}

Object.defineProperty(SVGElement.prototype, "setPointerCapture", {
  configurable: true,
  value: () => undefined,
});

afterEach(() => {
  cleanup();
});
