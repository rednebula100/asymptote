import { ANGLE_EPSILON, EPSILON } from "./constants";
import { failure, success } from "./result";
import type { MathResult, Point2 } from "./types";
import { validatePoint } from "./validation";
import { distanceSquared, lengthSquared } from "./vector";

export const hyperbolicDistance = (
  a: Point2,
  b: Point2,
): MathResult<number> => {
  const validA = validatePoint(a);
  if (!validA.ok) return validA;
  const validB = validatePoint(b);
  if (!validB.ok) return validB;

  const separationSquared = distanceSquared(a, b);
  if (separationSquared <= EPSILON * EPSILON) {
    return success(0);
  }

  const denominator = (1 - lengthSquared(a)) * (1 - lengthSquared(b));
  if (denominator <= 0) {
    return failure(
      "POINT_OUTSIDE_DISK",
      "Distance is undefined at or beyond the unit boundary.",
    );
  }

  const rawAcoshInput = 1 + (2 * separationSquared) / denominator;
  if (
    !Number.isFinite(rawAcoshInput) ||
    rawAcoshInput < 1 - ANGLE_EPSILON
  ) {
    return failure("INVALID_RESULT", "Distance calculation became unstable.");
  }

  const result = Math.acosh(Math.max(1, rawAcoshInput));
  if (!Number.isFinite(result) || result < 0) {
    return failure("INVALID_RESULT", "Distance calculation was not finite.");
  }
  return success(result);
};

export const radialDistanceFromOrigin = (
  radius: number,
): MathResult<number> => {
  if (!Number.isFinite(radius)) {
    return failure("NON_FINITE_INPUT", "Radius must be finite.");
  }
  if (radius < 0 || radius >= 1) {
    return failure(
      "POINT_OUTSIDE_DISK",
      "Radius must lie in the interval [0, 1).",
    );
  }
  const result = Math.log((1 + radius) / (1 - radius));
  return Number.isFinite(result)
    ? success(result)
    : failure("INVALID_RESULT", "Radial distance was not finite.");
};
