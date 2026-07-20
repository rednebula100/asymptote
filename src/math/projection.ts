import { EPSILON } from "./constants";
import { failure, success } from "./result";
import type { MathResult, Point2 } from "./types";
import { isFinitePoint } from "./validation";

export const projectToRadius = (
  point: Point2,
  maxRadius: number,
): MathResult<Point2> => {
  if (!isFinitePoint(point) || !Number.isFinite(maxRadius)) {
    return failure("NON_FINITE_INPUT", "Projection inputs must be finite.");
  }
  if (maxRadius <= 0 || maxRadius >= 1) {
    return failure(
      "POINT_OUTSIDE_DISK",
      "Projection radius must be greater than zero and less than one.",
    );
  }
  const magnitude = Math.hypot(point.x, point.y);
  if (magnitude <= maxRadius || magnitude <= EPSILON) {
    return success({ x: point.x, y: point.y });
  }
  const factor = maxRadius / magnitude;
  const projected = { x: point.x * factor, y: point.y * factor };
  if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)) {
    return failure("INVALID_RESULT", "Projection produced an invalid point.");
  }
  return success(projected);
};
