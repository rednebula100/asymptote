import { failure, success } from "./result";
import type { MathResult, Point2 } from "./types";

export const isFinitePoint = (point: Point2): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y);

export const isPointInOpenDisk = (point: Point2): boolean =>
  isFinitePoint(point) && point.x * point.x + point.y * point.y < 1;

export const validatePoint = (point: Point2): MathResult<Point2> => {
  if (!isFinitePoint(point)) {
    return failure("NON_FINITE_INPUT", "Point coordinates must be finite.");
  }
  if (!isPointInOpenDisk(point)) {
    return failure(
      "POINT_OUTSIDE_DISK",
      "Hyperbolic points must lie strictly inside the unit disk.",
    );
  }
  return success({ x: point.x, y: point.y });
};

export const clamp = (value: number, min: number, max: number): number => {
  if (![value, min, max].every(Number.isFinite) || min > max) {
    throw new RangeError("Clamp requires finite values with min <= max.");
  }
  return Math.min(max, Math.max(min, value));
};

export const clampUnit = (value: number): number => clamp(value, -1, 1);
export const clampAcosInput = clampUnit;

export const clampAcoshInput = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new RangeError("acosh input must be finite.");
  }
  return Math.max(1, value);
};
