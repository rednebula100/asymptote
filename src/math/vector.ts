import { EPSILON } from "./constants";
import { failure, success } from "./result";
import type { MathResult, Point2, Vector2 } from "./types";

const assertFinitePoint = (point: Point2, name: string): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${name} must contain only finite coordinates.`);
  }
};

export const add = (a: Point2, b: Point2): Point2 => {
  assertFinitePoint(a, "a");
  assertFinitePoint(b, "b");
  return { x: a.x + b.x, y: a.y + b.y };
};

export const subtract = (a: Point2, b: Point2): Vector2 => {
  assertFinitePoint(a, "a");
  assertFinitePoint(b, "b");
  return { x: a.x - b.x, y: a.y - b.y };
};

export const scale = (vector: Vector2, scalar: number): Vector2 => {
  assertFinitePoint(vector, "vector");
  if (!Number.isFinite(scalar)) {
    throw new RangeError("scalar must be finite.");
  }
  return { x: vector.x * scalar, y: vector.y * scalar };
};

export const dot = (a: Vector2, b: Vector2): number => {
  assertFinitePoint(a, "a");
  assertFinitePoint(b, "b");
  return a.x * b.x + a.y * b.y;
};

export const cross = (a: Vector2, b: Vector2): number => {
  assertFinitePoint(a, "a");
  assertFinitePoint(b, "b");
  return a.x * b.y - a.y * b.x;
};

export const lengthSquared = (vector: Vector2): number => dot(vector, vector);

export const length = (vector: Vector2): number => {
  assertFinitePoint(vector, "vector");
  return Math.hypot(vector.x, vector.y);
};

export const distanceSquared = (a: Point2, b: Point2): number =>
  lengthSquared(subtract(a, b));

export const distance = (a: Point2, b: Point2): number =>
  length(subtract(a, b));

export const normalize = (vector: Vector2): MathResult<Vector2> => {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    return failure("NON_FINITE_INPUT", "Cannot normalize a non-finite vector.");
  }
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude <= EPSILON) {
    return failure("ZERO_VECTOR", "Cannot normalize a zero-length vector.");
  }
  return success({ x: vector.x / magnitude, y: vector.y / magnitude });
};

export const negate = (vector: Vector2): Vector2 => scale(vector, -1);

export const rotate90CCW = (vector: Vector2): Vector2 => {
  assertFinitePoint(vector, "vector");
  return { x: -vector.y, y: vector.x };
};

export const rotate90CW = (vector: Vector2): Vector2 => {
  assertFinitePoint(vector, "vector");
  return { x: vector.y, y: -vector.x };
};

export const midpoint = (a: Point2, b: Point2): Point2 =>
  scale(add(a, b), 0.5);
