import {
  INTERACTION_MAX_RADIUS,
  MATH_SPEC_VERSION,
  MODEL_NAME,
} from "./constants";
import { radialDistanceFromOrigin } from "./distance";
import { failure, success } from "./result";
import { solveHyperbolicTriangle } from "./triangle";
import type {
  MathResult,
  NumberTriple,
  RadialTriangleSeries,
  RadiusDistanceSeries,
  TriangleVertices,
} from "./types";
import { length } from "./vector";
import { EPSILON } from "./constants";

export interface RadiusSeriesConfig {
  readonly sampleCount?: number;
  readonly minRadius?: number;
  readonly maxRadius?: number;
}

export interface RadialTriangleSeriesConfig extends RadiusSeriesConfig {
  readonly directionAngles?: NumberTriple;
  readonly presetId?: string;
}

const validateSweep = (
  sampleCount: number,
  minRadius: number,
  maxRadius: number,
): MathResult<true> => {
  if (![sampleCount, minRadius, maxRadius].every(Number.isFinite)) {
    return failure("NON_FINITE_INPUT", "Experiment configuration must be finite.");
  }
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    return failure("UNSTABLE_GEOMETRY", "Experiment needs at least two samples.");
  }
  if (minRadius < 0 || maxRadius >= 1 || minRadius >= maxRadius) {
    return failure(
      "POINT_OUTSIDE_DISK",
      "Experiment radii must satisfy 0 <= min < max < 1.",
    );
  }
  return success(true);
};

const interpolate = (
  index: number,
  count: number,
  min: number,
  max: number,
): number => min + (index / (count - 1)) * (max - min);

export const generateRadiusDistanceSeries = (
  config: RadiusSeriesConfig = {},
): MathResult<RadiusDistanceSeries> => {
  const sampleCount = config.sampleCount ?? 120;
  const minRadius = config.minRadius ?? 0;
  const maxRadius = config.maxRadius ?? INTERACTION_MAX_RADIUS;
  const validation = validateSweep(sampleCount, minRadius, maxRadius);
  if (!validation.ok) return validation;

  const samples = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const radius = interpolate(index, sampleCount, minRadius, maxRadius);
    const distance = radialDistanceFromOrigin(radius);
    if (!distance.ok) return distance;
    samples.push({ index, radius, distance: distance.value });
  }
  return success({
    kind: "radius-distance",
    model: MODEL_NAME,
    mathSpecVersion: MATH_SPEC_VERSION,
    samples,
  });
};

const DEFAULT_DIRECTIONS: NumberTriple = [
  Math.PI / 2,
  (7 * Math.PI) / 6,
  (11 * Math.PI) / 6,
];

export const directionAnglesForTriangle = (
  vertices: TriangleVertices,
): MathResult<NumberTriple> => {
  if (
    vertices.some(
      (vertex) =>
        !Number.isFinite(vertex.x) ||
        !Number.isFinite(vertex.y) ||
        length(vertex) <= EPSILON,
    )
  ) {
    return failure(
      "UNSTABLE_GEOMETRY",
      "Move every vertex away from the origin to define a radial family.",
    );
  }
  const directions = vertices.map((vertex) =>
    Math.atan2(vertex.y, vertex.x),
  ) as unknown as NumberTriple;
  const probeVertices = directions.map((angle) => ({
    x: 0.5 * Math.cos(angle),
    y: 0.5 * Math.sin(angle),
  })) as unknown as TriangleVertices;
  const probe = solveHyperbolicTriangle(probeVertices);
  if (!probe.ok) {
    return failure(
      "DEGENERATE_TRIANGLE",
      "The current directions do not define a stable radial triangle family.",
    );
  }
  return success(directions);
};

export const generateRadialTriangleSeries = (
  config: RadialTriangleSeriesConfig = {},
): MathResult<RadialTriangleSeries> => {
  const sampleCount = config.sampleCount ?? 120;
  const minRadius = config.minRadius ?? 0.01;
  const maxRadius = config.maxRadius ?? INTERACTION_MAX_RADIUS;
  const directionAngles = config.directionAngles ?? DEFAULT_DIRECTIONS;
  const presetId = config.presetId ?? "current-shape";
  const validation = validateSweep(sampleCount, minRadius, maxRadius);
  if (!validation.ok) return validation;
  if (!directionAngles.every(Number.isFinite)) {
    return failure("NON_FINITE_INPUT", "Direction angles must be finite.");
  }
  if (presetId.trim().length === 0) {
    return failure("UNSTABLE_GEOMETRY", "Experiment preset id cannot be empty.");
  }

  const samples = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const radius = interpolate(index, sampleCount, minRadius, maxRadius);
    const vertices = directionAngles.map((angle) => ({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    })) as unknown as TriangleVertices;
    const triangle = solveHyperbolicTriangle(vertices);
    if (!triangle.ok) {
      return failure(
        triangle.code,
        `Triangle experiment failed at sample ${index}: ${triangle.message}`,
      );
    }
    samples.push({
      index,
      radius,
      angleSum: triangle.value.angleSum,
      defect: triangle.value.defect,
      area: triangle.value.area,
      triangle: triangle.value,
    });
  }
  return success({
    kind: "radial-triangle",
    model: MODEL_NAME,
    mathSpecVersion: MATH_SPEC_VERSION,
    presetId,
    directionAngles: [...directionAngles],
    samples,
  });
};
