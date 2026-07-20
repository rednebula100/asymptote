import { describe, expect, it } from "vitest";
import { CANVAS_EXTENT, clientPointToMath } from "../rendering/coordinates";

describe("screen-to-mathematical coordinate isolation", () => {
  const bounds = { left: 100, top: 50, width: 400, height: 400 } as const;

  it("maps the screen center to the mathematical origin", () => {
    expect(clientPointToMath(300, 250, bounds)).toEqual({ x: 0, y: 0 });
  });

  it("inverts the screen y-axis at the rendering boundary", () => {
    const top = clientPointToMath(300, 50, bounds);
    const bottom = clientPointToMath(300, 450, bounds);
    expect(top?.y).toBeCloseTo(CANVAS_EXTENT, 12);
    expect(bottom?.y).toBeCloseTo(-CANVAS_EXTENT, 12);
  });

  it("rejects invalid screen bounds", () => {
    expect(clientPointToMath(0, 0, { ...bounds, width: 0 })).toBeNull();
    expect(clientPointToMath(Number.NaN, 0, bounds)).toBeNull();
  });
});
