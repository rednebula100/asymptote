import {
  EPSILON,
  GEOMETRY_EPSILON,
  STANDARD_TOLERANCE,
} from "./constants";
import { failure, success } from "./result";
import type {
  CircularGeodesic,
  DiameterGeodesic,
  GeodesicSegment,
  MathResult,
  Point2,
} from "./types";
import { validatePoint } from "./validation";
import {
  cross,
  distance,
  distanceSquared,
  length,
  lengthSquared,
  normalize,
  subtract,
} from "./vector";

const TWO_PI = 2 * Math.PI;

const wrapToPi = (angle: number): number => {
  const wrapped = ((angle + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  return wrapped <= -Math.PI ? Math.PI : wrapped;
};

const approximatelyEqual = (a: number, b: number, scaleValue = 1): boolean =>
  Math.abs(a - b) <= STANDARD_TOLERANCE * Math.max(1, scaleValue);

const pointFromCircle = (
  center: Point2,
  radius: number,
  angle: number,
): Point2 => ({
  x: center.x + radius * Math.cos(angle),
  y: center.y + radius * Math.sin(angle),
});

export const areCollinearWithOrigin = (p: Point2, q: Point2): boolean => {
  if (
    !Number.isFinite(p.x) ||
    !Number.isFinite(p.y) ||
    !Number.isFinite(q.x) ||
    !Number.isFinite(q.y)
  ) {
    return false;
  }
  const scale = Math.max(1, length(p) * length(q));
  return Math.abs(cross(p, q)) <= GEOMETRY_EPSILON * scale;
};

export const createDiameterGeodesic = (
  p: Point2,
  q: Point2,
): MathResult<DiameterGeodesic> => {
  const validP = validatePoint(p);
  if (!validP.ok) return validP;
  const validQ = validatePoint(q);
  if (!validQ.ok) return validQ;
  if (distanceSquared(p, q) <= EPSILON * EPSILON) {
    return failure("COINCIDENT_POINTS", "A geodesic needs two distinct points.");
  }
  if (!areCollinearWithOrigin(p, q)) {
    return failure(
      "UNSTABLE_GEOMETRY",
      "These points do not define a diameter geodesic.",
    );
  }
  const direction = normalize(subtract(q, p));
  if (!direction.ok) return direction;
  return success({
    kind: "diameter",
    a: { ...p },
    b: { ...q },
    direction: direction.value,
  });
};

export const createCircularGeodesic = (
  p: Point2,
  q: Point2,
): MathResult<CircularGeodesic> => {
  const validP = validatePoint(p);
  if (!validP.ok) return validP;
  const validQ = validatePoint(q);
  if (!validQ.ok) return validQ;
  if (distanceSquared(p, q) <= EPSILON * EPSILON) {
    return failure("COINCIDENT_POINTS", "A geodesic needs two distinct points.");
  }

  const determinant = cross(p, q);
  const determinantThreshold =
    GEOMETRY_EPSILON * Math.max(1, length(p) * length(q));
  if (Math.abs(determinant) <= determinantThreshold) {
    return failure(
      "UNSTABLE_GEOMETRY",
      "Near-collinear points should use the stable diameter representation.",
    );
  }

  const sp = (lengthSquared(p) + 1) / 2;
  const sq = (lengthSquared(q) + 1) / 2;
  const center = {
    x: (sp * q.y - p.y * sq) / determinant,
    y: (p.x * sq - sp * q.x) / determinant,
  };
  if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) {
    return failure("INVALID_RESULT", "Geodesic center was not finite.");
  }

  let radiusSquared = lengthSquared(center) - 1;
  if (radiusSquared < -GEOMETRY_EPSILON) {
    return failure(
      "UNSTABLE_GEOMETRY",
      "The supporting circle radius could not be resolved.",
    );
  }
  radiusSquared = Math.max(0, radiusSquared);
  const radius = Math.sqrt(radiusSquared);
  if (!Number.isFinite(radius) || radius <= EPSILON) {
    return failure("INVALID_RESULT", "Geodesic circle radius was invalid.");
  }

  const endpointScale = Math.max(1, radius, length(center));
  const distanceP = distance(p, center);
  const distanceQ = distance(q, center);
  const orthogonality = lengthSquared(center) - radius * radius;
  if (
    !approximatelyEqual(distanceP, radius, endpointScale) ||
    !approximatelyEqual(distanceQ, radius, endpointScale) ||
    !approximatelyEqual(orthogonality, 1, endpointScale * endpointScale)
  ) {
    return failure(
      "UNSTABLE_GEOMETRY",
      "The supporting circle failed its geometric invariants.",
    );
  }

  const startAngle = Math.atan2(p.y - center.y, p.x - center.x);
  const endAngle = Math.atan2(q.y - center.y, q.x - center.x);
  const shortDelta = wrapToPi(endAngle - startAngle);
  const shortMidpoint = pointFromCircle(
    center,
    radius,
    startAngle + shortDelta / 2,
  );
  const shortInside = lengthSquared(shortMidpoint) < 1;
  const deltaAngle = shortInside
    ? shortDelta
    : shortDelta > 0
      ? shortDelta - TWO_PI
      : shortDelta + TWO_PI;

  if (!Number.isFinite(startAngle) || !Number.isFinite(deltaAngle)) {
    return failure("INVALID_RESULT", "Geodesic arc angles were invalid.");
  }

  for (const t of [0.25, 0.5, 0.75]) {
    const sample = pointFromCircle(center, radius, startAngle + t * deltaAngle);
    if (lengthSquared(sample) >= 1 + GEOMETRY_EPSILON) {
      return failure(
        "UNSTABLE_GEOMETRY",
        "The selected geodesic arc leaves the unit disk.",
      );
    }
  }

  return success({
    kind: "circle",
    a: { ...p },
    b: { ...q },
    circle: { center, radius },
    startAngle,
    deltaAngle,
  });
};

export const createGeodesicSegment = (
  p: Point2,
  q: Point2,
): MathResult<GeodesicSegment> => {
  const validP = validatePoint(p);
  if (!validP.ok) return validP;
  const validQ = validatePoint(q);
  if (!validQ.ok) return validQ;
  if (distanceSquared(p, q) <= EPSILON * EPSILON) {
    return failure("COINCIDENT_POINTS", "A geodesic needs two distinct points.");
  }
  return areCollinearWithOrigin(p, q)
    ? createDiameterGeodesic(p, q)
    : createCircularGeodesic(p, q);
};

export const pointOnCircularArc = (
  geodesic: CircularGeodesic,
  t: number,
): MathResult<Point2> => {
  if (!Number.isFinite(t)) {
    return failure("NON_FINITE_INPUT", "Arc parameter must be finite.");
  }
  if (t < 0 || t > 1) {
    return failure("UNSTABLE_GEOMETRY", "Arc parameter must lie in [0, 1].");
  }
  if (t === 0) return success({ ...geodesic.a });
  if (t === 1) return success({ ...geodesic.b });
  const { center, radius } = geodesic.circle;
  if (
    ![center.x, center.y, radius, geodesic.startAngle, geodesic.deltaAngle].every(
      Number.isFinite,
    )
  ) {
    return failure("NON_FINITE_INPUT", "Circular geodesic must be finite.");
  }
  const point = pointFromCircle(
    center,
    radius,
    geodesic.startAngle + t * geodesic.deltaAngle,
  );
  return Number.isFinite(point.x) && Number.isFinite(point.y)
    ? success(point)
    : failure("INVALID_RESULT", "Arc sampling produced an invalid point.");
};
