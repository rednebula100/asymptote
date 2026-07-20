import { GEOMETRY_EPSILON } from "./constants";
import { failure, success } from "./result";
import type { GeodesicSegment, MathResult, Point2, Vector2 } from "./types";
import {
  distanceSquared,
  dot,
  negate,
  normalize,
  rotate90CCW,
  subtract,
} from "./vector";

const endpointMatches = (candidate: Point2, expected: Point2): boolean =>
  distanceSquared(candidate, expected) <= GEOMETRY_EPSILON * GEOMETRY_EPSILON;

export const tangentAtEndpoint = (
  geodesic: GeodesicSegment,
  vertex: Point2,
  toward: Point2,
): MathResult<Vector2> => {
  const matchesA = endpointMatches(vertex, geodesic.a);
  const matchesB = endpointMatches(vertex, geodesic.b);
  if (!matchesA && !matchesB) {
    return failure(
      "UNSTABLE_GEOMETRY",
      "The tangent vertex is not an endpoint of this geodesic.",
    );
  }
  const expectedToward = matchesA ? geodesic.b : geodesic.a;
  if (!endpointMatches(toward, expectedToward)) {
    return failure(
      "UNSTABLE_GEOMETRY",
      "The tangent direction must target the opposite endpoint.",
    );
  }

  if (geodesic.kind === "diameter") {
    return normalize(subtract(toward, vertex));
  }

  const radiusVector = subtract(vertex, geodesic.circle.center);
  const candidate = normalize(rotate90CCW(radiusVector));
  if (!candidate.ok) return candidate;
  const towardVector = subtract(toward, vertex);
  const directed = dot(candidate.value, towardVector) >= 0
    ? candidate.value
    : negate(candidate.value);
  return success(directed);
};
