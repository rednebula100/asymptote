import { describe, expect, it } from "vitest";
import {
  add,
  cross,
  distance,
  dot,
  isFinitePoint,
  isPointInOpenDisk,
  length,
  normalize,
  projectToRadius,
  rotate90CCW,
  scale,
  subtract,
} from "..";

describe("Euclidean vector primitives", () => {
  it("performs vector arithmetic without mutation", () => {
    const a = { x: 2, y: -1 } as const;
    const b = { x: -3, y: 4 } as const;
    expect(add(a, b)).toEqual({ x: -1, y: 3 });
    expect(subtract(a, b)).toEqual({ x: 5, y: -5 });
    expect(scale(a, 2)).toEqual({ x: 4, y: -2 });
    expect(a).toEqual({ x: 2, y: -1 });
  });

  it("computes dot, cross, length, distance, and rotation", () => {
    expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
    expect(cross({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(-2);
    expect(length({ x: 3, y: 4 })).toBe(5);
    expect(distance({ x: -1, y: 0 }, { x: 2, y: 4 })).toBe(5);
    expect(rotate90CCW({ x: 3, y: 4 })).toEqual({ x: -4, y: 3 });
  });

  it("normalizes nonzero vectors and rejects zero vectors", () => {
    const normalized = normalize({ x: 3, y: 4 });
    expect(normalized.ok).toBe(true);
    if (normalized.ok) expect(length(normalized.value)).toBeCloseTo(1, 12);
    const zero = normalize({ x: 0, y: 0 });
    expect(zero).toMatchObject({ ok: false, code: "ZERO_VECTOR" });
  });
});

describe("point validation and radial projection", () => {
  it("accepts only finite points in the open disk", () => {
    expect(isFinitePoint({ x: 0.2, y: 0.3 })).toBe(true);
    expect(isFinitePoint({ x: Number.NaN, y: 0 })).toBe(false);
    expect(isFinitePoint({ x: Number.POSITIVE_INFINITY, y: 0 })).toBe(false);
    expect(isPointInOpenDisk({ x: 0.6, y: 0.6 })).toBe(true);
    expect(isPointInOpenDisk({ x: 1, y: 0 })).toBe(false);
    expect(isPointInOpenDisk({ x: 1.1, y: 0 })).toBe(false);
  });

  it("leaves an interior point and the origin unchanged", () => {
    expect(projectToRadius({ x: 0.2, y: 0.1 }, 0.995)).toEqual({
      ok: true,
      value: { x: 0.2, y: 0.1 },
    });
    expect(projectToRadius({ x: 0, y: 0 }, 0.995)).toEqual({
      ok: true,
      value: { x: 0, y: 0 },
    });
  });

  it("projects radially while preserving direction", () => {
    const projected = projectToRadius({ x: 3, y: 4 }, 0.8);
    expect(projected.ok).toBe(true);
    if (projected.ok) {
      expect(length(projected.value)).toBeCloseTo(0.8, 12);
      expect(projected.value.x / projected.value.y).toBeCloseTo(3 / 4, 12);
    }
  });

  it("rejects invalid projection inputs", () => {
    expect(projectToRadius({ x: Number.NaN, y: 0 }, 0.9)).toMatchObject({
      ok: false,
      code: "NON_FINITE_INPUT",
    });
    expect(projectToRadius({ x: 1, y: 0 }, 1)).toMatchObject({ ok: false });
  });
});
