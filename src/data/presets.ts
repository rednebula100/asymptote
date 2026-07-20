import { INTERACTION_MAX_RADIUS } from "../math";
import type { Point2, TriangleVertices } from "../math";

export type LabMode = "triangle" | "geodesic";

export interface ExperimentPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly mode: LabMode;
  readonly vertices: TriangleVertices;
}

const radialTriangle = (radius: number): TriangleVertices => [
  { x: 0, y: radius },
  {
    x: radius * Math.cos((7 * Math.PI) / 6),
    y: radius * Math.sin((7 * Math.PI) / 6),
  },
  {
    x: radius * Math.cos((11 * Math.PI) / 6),
    y: radius * Math.sin((11 * Math.PI) / 6),
  },
];

const point = (x: number, y: number): Point2 => ({ x, y });

export const DEFAULT_VERTICES: TriangleVertices = [
  point(0.08, 0.62),
  point(-0.58, -0.28),
  point(0.51, -0.36),
];

export const PRESETS: readonly ExperimentPreset[] = [
  {
    id: "near-center",
    name: "Near center",
    description: "A small triangle where the geometry looks almost Euclidean.",
    mode: "triangle",
    vertices: [
      point(0.1, 0),
      point(-0.05, 0.0866025404),
      point(-0.05, -0.0866025404),
    ],
  },
  {
    id: "boundary",
    name: "Boundary triangle",
    description: "The same symmetric shape expanded to radius 0.9.",
    mode: "triangle",
    vertices: radialTriangle(0.9),
  },
  {
    id: "near-ideal",
    name: "Near-ideal",
    description: "Three finite vertices at the interaction limit—not at infinity.",
    mode: "triangle",
    vertices: radialTriangle(INTERACTION_MAX_RADIUS),
  },
  {
    id: "diameter",
    name: "Diameter geodesic",
    description: "Collinear points produce a straight Euclidean diameter segment.",
    mode: "geodesic",
    vertices: [point(-0.68, 0), point(0.72, 0), point(0.18, 0.45)],
  },
  {
    id: "circular",
    name: "Circular geodesic",
    description: "Non-collinear points lie on a circle orthogonal to the boundary.",
    mode: "geodesic",
    vertices: [point(-0.55, 0.18), point(0.35, 0.48), point(0.18, -0.42)],
  },
] as const;
