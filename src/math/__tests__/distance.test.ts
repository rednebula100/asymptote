import { describe, expect, it } from "vitest";
import { hyperbolicDistance, radialDistanceFromOrigin } from "..";
import type { Point2 } from "..";

const valueOf = (result: ReturnType<typeof hyperbolicDistance>): number => {
  if (!result.ok) throw new Error(result.message);
  return result.value;
};

describe("hyperbolic distance", () => {
  const a = { x: 0.1, y: 0.2 };
  const b = { x: -0.35, y: 0.15 };
  const c = { x: 0.2, y: -0.4 };

  it("satisfies identity, symmetry, positivity, and triangle inequality", () => {
    expect(valueOf(hyperbolicDistance(a, a))).toBe(0);
    const ab = valueOf(hyperbolicDistance(a, b));
    const ba = valueOf(hyperbolicDistance(b, a));
    expect(ab).toBeGreaterThan(0);
    expect(ab).toBeCloseTo(ba, 12);
    expect(valueOf(hyperbolicDistance(a, c))).toBeLessThanOrEqual(
      ab + valueOf(hyperbolicDistance(b, c)) + 1e-10,
    );
  });

  it("matches the origin reference value ln(3)", () => {
    const result = valueOf(hyperbolicDistance({ x: 0, y: 0 }, { x: 0.5, y: 0 }));
    expect(result).toBeCloseTo(Math.log(3), 12);
  });

  it("agrees with the radial closed form", () => {
    for (const radius of [0, 0.1, 0.5, 0.9, 0.995]) {
      const closed = radialDistanceFromOrigin(radius);
      expect(closed.ok).toBe(true);
      if (closed.ok) {
        expect(
          valueOf(hyperbolicDistance({ x: 0, y: 0 }, { x: radius, y: 0 })),
        ).toBeCloseTo(closed.value, 10);
      }
    }
  });

  it("grows monotonically and remains finite at the interaction limit", () => {
    const values = [0.2, 0.5, 0.9, 0.995].map((radius) =>
      valueOf(hyperbolicDistance({ x: 0, y: 0 }, { x: radius, y: 0 })),
    );
    expect(values[1]).toBeGreaterThan(values[0] ?? 0);
    expect(values[2]).toBeGreaterThan(values[1] ?? 0);
    expect(values[3]).toBeGreaterThan(values[2] ?? 0);
    expect(Number.isFinite(values[3])).toBe(true);
  });

  it.each<Point2>([
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: Number.NaN, y: 0 },
    { x: Number.POSITIVE_INFINITY, y: 0 },
  ])("rejects invalid point %#", (point) => {
    expect(hyperbolicDistance({ x: 0, y: 0 }, point).ok).toBe(false);
  });
});
