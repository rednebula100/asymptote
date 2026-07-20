import type { Point2 } from "../math";

export const CANVAS_EXTENT = 1.12;

export interface CanvasBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export const clientPointToMath = (
  clientX: number,
  clientY: number,
  bounds: CanvasBounds,
): Point2 | null => {
  if (
    ![clientX, clientY, bounds.left, bounds.top, bounds.width, bounds.height].every(
      Number.isFinite,
    ) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return null;
  }
  return {
    x: ((clientX - bounds.left) / bounds.width) * (2 * CANVAS_EXTENT) - CANVAS_EXTENT,
    y: CANVAS_EXTENT - ((clientY - bounds.top) / bounds.height) * (2 * CANVAS_EXTENT),
  };
};
