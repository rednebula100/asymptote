import { ANGLE_EPSILON, EPSILON, GEOMETRY_EPSILON } from "./constants";
import { hyperbolicDistance } from "./distance";
import { createGeodesicSegment } from "./geodesic";
import { failure, success } from "./result";
import { tangentAtEndpoint } from "./tangent";
import type {
  GeodesicSegment,
  HyperbolicTriangle,
  MathResult,
  NumberTriple,
  Point2,
  TriangleVertices,
} from "./types";
import { clampAcosInput, validatePoint } from "./validation";
import { cross, distanceSquared, dot, length, subtract } from "./vector";

export const maxVertexRadius = (
  vertices: TriangleVertices,
): MathResult<number> => {
  for (const vertex of vertices) {
    const validation = validatePoint(vertex);
    if (!validation.ok) return validation;
  }
  const radius = Math.max(...vertices.map((vertex) => length(vertex)));
  return Number.isFinite(radius)
    ? success(radius)
    : failure("INVALID_RESULT", "Maximum vertex radius was invalid.");
};

const angleFromSides = (
  first: GeodesicSegment,
  second: GeodesicSegment,
  vertex: Point2,
  firstNeighbor: Point2,
  secondNeighbor: Point2,
): MathResult<number> => {
  const firstTangent = tangentAtEndpoint(first, vertex, firstNeighbor);
  if (!firstTangent.ok) return firstTangent;
  const secondTangent = tangentAtEndpoint(second, vertex, secondNeighbor);
  if (!secondTangent.ok) return secondTangent;
  const cosine = dot(firstTangent.value, secondTangent.value);
  if (!Number.isFinite(cosine) || cosine < -1 - ANGLE_EPSILON || cosine > 1 + ANGLE_EPSILON) {
    return failure("INVALID_RESULT", "Triangle angle calculation became unstable.");
  }
  const angle = Math.acos(clampAcosInput(cosine));
  return Number.isFinite(angle) && angle > 0 && angle < Math.PI
    ? success(angle)
    : failure("DEGENERATE_TRIANGLE", "Triangle contains a degenerate angle.");
};

export const triangleDefect = (angles: NumberTriple): MathResult<number> => {
  if (!angles.every(Number.isFinite)) {
    return failure("NON_FINITE_INPUT", "Triangle angles must be finite.");
  }
  if (angles.some((angle) => angle <= 0 || angle >= Math.PI)) {
    return failure(
      "DEGENERATE_TRIANGLE",
      "Triangle angles must lie strictly between zero and pi.",
    );
  }
  const sum = angles[0] + angles[1] + angles[2];
  if (sum > Math.PI + ANGLE_EPSILON) {
    return failure(
      "INVALID_RESULT",
      "A hyperbolic triangle angle sum cannot exceed pi.",
    );
  }
  const rawDefect = Math.PI - Math.min(sum, Math.PI);
  if (rawDefect < -ANGLE_EPSILON || !Number.isFinite(rawDefect)) {
    return failure("INVALID_RESULT", "Triangle defect was invalid.");
  }
  return success(Math.max(0, rawDefect));
};

export const triangleAreaFromAngles = (
  angles: NumberTriple,
): MathResult<number> => triangleDefect(angles);

export const solveHyperbolicTriangle = (
  vertices: TriangleVertices,
): MathResult<HyperbolicTriangle> => {
  const [aPoint, bPoint, cPoint] = vertices;
  for (const vertex of vertices) {
    const validation = validatePoint(vertex);
    if (!validation.ok) return validation;
  }
  if (
    distanceSquared(aPoint, bPoint) <= EPSILON * EPSILON ||
    distanceSquared(bPoint, cPoint) <= EPSILON * EPSILON ||
    distanceSquared(cPoint, aPoint) <= EPSILON * EPSILON
  ) {
    return failure(
      "COINCIDENT_POINTS",
      "A triangle needs three distinct vertices.",
    );
  }

  const ab = subtract(bPoint, aPoint);
  const ac = subtract(cPoint, aPoint);
  if (
    Math.abs(cross(ab, ac)) <=
    GEOMETRY_EPSILON * Math.max(1, length(ab) * length(ac))
  ) {
    return failure(
      "DEGENERATE_TRIANGLE",
      "The three vertices are collinear or numerically degenerate.",
    );
  }

  const sideBC = createGeodesicSegment(bPoint, cPoint);
  if (!sideBC.ok) return sideBC;
  const sideCA = createGeodesicSegment(cPoint, aPoint);
  if (!sideCA.ok) return sideCA;
  const sideAB = createGeodesicSegment(aPoint, bPoint);
  if (!sideAB.ok) return sideAB;

  const lengthA = hyperbolicDistance(bPoint, cPoint);
  if (!lengthA.ok) return lengthA;
  const lengthB = hyperbolicDistance(cPoint, aPoint);
  if (!lengthB.ok) return lengthB;
  const lengthC = hyperbolicDistance(aPoint, bPoint);
  if (!lengthC.ok) return lengthC;

  const alpha = angleFromSides(
    sideAB.value,
    sideCA.value,
    aPoint,
    bPoint,
    cPoint,
  );
  if (!alpha.ok) return alpha;
  const beta = angleFromSides(
    sideAB.value,
    sideBC.value,
    bPoint,
    aPoint,
    cPoint,
  );
  if (!beta.ok) return beta;
  const gamma = angleFromSides(
    sideBC.value,
    sideCA.value,
    cPoint,
    bPoint,
    aPoint,
  );
  if (!gamma.ok) return gamma;

  const angles: NumberTriple = [alpha.value, beta.value, gamma.value];
  const rawAngleSum = angles[0] + angles[1] + angles[2];
  if (rawAngleSum > Math.PI + ANGLE_EPSILON || rawAngleSum <= 0) {
    return failure("INVALID_RESULT", "Triangle angle sum failed its invariant.");
  }
  const angleSum = Math.min(rawAngleSum, Math.PI);
  const defectResult = triangleDefect(angles);
  if (!defectResult.ok) return defectResult;
  const areaResult = triangleAreaFromAngles(angles);
  if (!areaResult.ok) return areaResult;

  const sideLengths: NumberTriple = [
    lengthA.value,
    lengthB.value,
    lengthC.value,
  ];
  if (
    sideLengths.some((side) => !Number.isFinite(side) || side <= 0) ||
    !Number.isFinite(angleSum) ||
    !Number.isFinite(defectResult.value) ||
    !Number.isFinite(areaResult.value)
  ) {
    return failure("INVALID_RESULT", "Triangle measurements were invalid.");
  }

  return success({
    vertices: [{ ...aPoint }, { ...bPoint }, { ...cPoint }],
    sides: [sideBC.value, sideCA.value, sideAB.value],
    sideLengths,
    angles,
    angleSum,
    defect: defectResult.value,
    area: areaResult.value,
  });
};
