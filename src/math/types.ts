export interface Point2 {
  readonly x: number;
  readonly y: number;
}

export type Vector2 = Point2;

export interface EuclideanCircle {
  readonly center: Point2;
  readonly radius: number;
}

export interface DiameterGeodesic {
  readonly kind: "diameter";
  readonly a: Point2;
  readonly b: Point2;
  readonly direction: Vector2;
}

export interface CircularGeodesic {
  readonly kind: "circle";
  readonly a: Point2;
  readonly b: Point2;
  readonly circle: EuclideanCircle;
  readonly startAngle: number;
  readonly deltaAngle: number;
}

export type GeodesicSegment = DiameterGeodesic | CircularGeodesic;

export type TriangleVertices = readonly [Point2, Point2, Point2];
export type NumberTriple = readonly [number, number, number];

export interface HyperbolicTriangle {
  readonly vertices: TriangleVertices;
  /** Ordered [BC, CA, AB], opposite vertices [A, B, C]. */
  readonly sides: readonly [GeodesicSegment, GeodesicSegment, GeodesicSegment];
  /** Ordered [a = BC, b = CA, c = AB]. */
  readonly sideLengths: NumberTriple;
  /** Ordered [alpha at A, beta at B, gamma at C], in radians. */
  readonly angles: NumberTriple;
  readonly angleSum: number;
  readonly defect: number;
  readonly area: number;
}

export type MathErrorCode =
  | "NON_FINITE_INPUT"
  | "POINT_OUTSIDE_DISK"
  | "COINCIDENT_POINTS"
  | "DEGENERATE_TRIANGLE"
  | "ZERO_VECTOR"
  | "UNSTABLE_GEOMETRY"
  | "INVALID_RESULT";

export type MathResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly code: MathErrorCode;
      readonly message: string;
    };

export interface RadiusDistanceSample {
  readonly index: number;
  readonly radius: number;
  readonly distance: number;
}

export interface RadialTriangleSample {
  readonly index: number;
  readonly radius: number;
  readonly angleSum: number;
  readonly defect: number;
  readonly area: number;
  readonly triangle: HyperbolicTriangle;
}

export interface RadiusDistanceSeries {
  readonly kind: "radius-distance";
  readonly model: "poincare-disk";
  readonly mathSpecVersion: "1.0";
  readonly samples: readonly RadiusDistanceSample[];
}

export interface RadialTriangleSeries {
  readonly kind: "radial-triangle";
  readonly model: "poincare-disk";
  readonly mathSpecVersion: "1.0";
  readonly presetId: string;
  readonly directionAngles: NumberTriple;
  readonly samples: readonly RadialTriangleSample[];
}

export interface TriangleSnapshot {
  readonly id: string;
  readonly label: string;
  readonly model: "poincare-disk";
  readonly curvature: -1;
  readonly vertices: TriangleVertices;
  readonly sideLengths: NumberTriple;
  readonly anglesRadians: NumberTriple;
  readonly angleSumRadians: number;
  readonly defectRadians: number;
  readonly area: number;
  readonly maxVertexRadius: number;
  readonly createdAt: string;
  readonly mathSpecVersion: "1.0";
}
