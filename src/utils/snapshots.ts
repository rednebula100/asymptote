import {
  BOUNDARY_TOLERANCE,
  CURVATURE,
  MATH_SPEC_VERSION,
  MODEL_NAME,
  failure,
  maxVertexRadius,
  solveHyperbolicTriangle,
  success,
} from "../math";
import type {
  HyperbolicTriangle,
  MathResult,
  TriangleSnapshot,
} from "../math";
import { radiansToDegrees } from "./format";

export interface SnapshotMetadata {
  readonly id: string;
  readonly label: string;
  readonly createdAt: string;
}

export const createTriangleSnapshot = (
  triangle: HyperbolicTriangle,
  metadata: SnapshotMetadata,
): MathResult<TriangleSnapshot> => {
  const radius = maxVertexRadius(triangle.vertices);
  if (!radius.ok) return radius;
  const numericValues = [
    ...triangle.vertices.flatMap((vertex) => [vertex.x, vertex.y]),
    ...triangle.sideLengths,
    ...triangle.angles,
    triangle.angleSum,
    triangle.defect,
    triangle.area,
    radius.value,
  ];
  if (!numericValues.every(Number.isFinite)) {
    return failure("INVALID_RESULT", "Snapshot contains invalid measurements.");
  }
  if (
    metadata.id.trim().length === 0 ||
    metadata.label.trim().length === 0 ||
    Number.isNaN(new Date(metadata.createdAt).getTime())
  ) {
    return failure("INVALID_RESULT", "Snapshot metadata is incomplete.");
  }
  return success({
    id: metadata.id,
    label: metadata.label,
    model: MODEL_NAME,
    curvature: CURVATURE,
    vertices: triangle.vertices.map((vertex) => ({ ...vertex })) as unknown as TriangleSnapshot["vertices"],
    sideLengths: [...triangle.sideLengths],
    anglesRadians: [...triangle.angles],
    angleSumRadians: triangle.angleSum,
    defectRadians: triangle.defect,
    area: triangle.area,
    maxVertexRadius: radius.value,
    createdAt: metadata.createdAt,
    mathSpecVersion: MATH_SPEC_VERSION,
  });
};

export const restoreTriangleSnapshot = (
  snapshot: TriangleSnapshot,
): MathResult<HyperbolicTriangle> => {
  const solved = solveHyperbolicTriangle(snapshot.vertices);
  if (!solved.ok) return solved;
  const stored = [
    ...snapshot.sideLengths,
    ...snapshot.anglesRadians,
    snapshot.angleSumRadians,
    snapshot.defectRadians,
    snapshot.area,
  ];
  const recomputed = [
    ...solved.value.sideLengths,
    ...solved.value.angles,
    solved.value.angleSum,
    solved.value.defect,
    solved.value.area,
  ];
  const integrityMatches = stored.every(
    (value, index) =>
      Number.isFinite(value) &&
      Math.abs(value - (recomputed[index] ?? Number.NaN)) <= BOUNDARY_TOLERANCE,
  );
  return integrityMatches
    ? solved
    : failure(
        "INVALID_RESULT",
        "Snapshot integrity check failed after recomputing its vertices.",
      );
};

const CSV_HEADERS = [
  "timestamp",
  "model",
  "curvature",
  "ax",
  "ay",
  "bx",
  "by",
  "cx",
  "cy",
  "side_a",
  "side_b",
  "side_c",
  "angle_alpha_rad",
  "angle_beta_rad",
  "angle_gamma_rad",
  "angle_sum_rad",
  "angle_sum_deg",
  "defect_rad",
  "defect_deg",
  "area",
  "max_vertex_radius",
  "math_spec_version",
] as const;

const escapeCsv = (value: string | number): string => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const snapshotsToCsv = (
  snapshots: readonly TriangleSnapshot[],
): MathResult<string> => {
  if (snapshots.length === 0) {
    return failure("INVALID_RESULT", "Save at least one snapshot before exporting.");
  }
  const rows: string[] = [CSV_HEADERS.join(",")];
  for (const snapshot of snapshots) {
    const [a, b, c] = snapshot.vertices;
    const values: readonly (string | number)[] = [
      snapshot.createdAt,
      snapshot.model,
      snapshot.curvature,
      a.x,
      a.y,
      b.x,
      b.y,
      c.x,
      c.y,
      ...snapshot.sideLengths,
      ...snapshot.anglesRadians,
      snapshot.angleSumRadians,
      radiansToDegrees(snapshot.angleSumRadians),
      snapshot.defectRadians,
      radiansToDegrees(snapshot.defectRadians),
      snapshot.area,
      snapshot.maxVertexRadius,
      snapshot.mathSpecVersion,
    ];
    if (values.some((value) => typeof value === "number" && !Number.isFinite(value))) {
      return failure("INVALID_RESULT", "CSV export contains an invalid number.");
    }
    rows.push(values.map(escapeCsv).join(","));
  }
  return success(`${rows.join("\n")}\n`);
};
