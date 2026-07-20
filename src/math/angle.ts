import { ANGLE_EPSILON } from "./constants";
import { createGeodesicSegment } from "./geodesic";
import { failure, success } from "./result";
import { tangentAtEndpoint } from "./tangent";
import type { MathResult, Point2 } from "./types";
import { clampAcosInput } from "./validation";
import { dot } from "./vector";

export const hyperbolicAngle = (
  vertex: Point2,
  firstNeighbor: Point2,
  secondNeighbor: Point2,
): MathResult<number> => {
  const firstSide = createGeodesicSegment(vertex, firstNeighbor);
  if (!firstSide.ok) return firstSide;
  const secondSide = createGeodesicSegment(vertex, secondNeighbor);
  if (!secondSide.ok) return secondSide;
  const firstTangent = tangentAtEndpoint(firstSide.value, vertex, firstNeighbor);
  if (!firstTangent.ok) return firstTangent;
  const secondTangent = tangentAtEndpoint(
    secondSide.value,
    vertex,
    secondNeighbor,
  );
  if (!secondTangent.ok) return secondTangent;

  const cosine = dot(firstTangent.value, secondTangent.value);
  if (!Number.isFinite(cosine) || cosine < -1 - ANGLE_EPSILON || cosine > 1 + ANGLE_EPSILON) {
    return failure("INVALID_RESULT", "Angle calculation became unstable.");
  }
  const angle = Math.acos(clampAcosInput(cosine));
  if (!Number.isFinite(angle) || angle <= 0 || angle >= Math.PI) {
    return failure(
      "DEGENERATE_TRIANGLE",
      "A nondegenerate angle must lie strictly between zero and pi.",
    );
  }
  return success(angle);
};
