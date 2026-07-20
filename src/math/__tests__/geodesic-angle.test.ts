import { describe, expect, it } from "vitest";
import {
  areCollinearWithOrigin,
  createGeodesicSegment,
  distance,
  dot,
  hyperbolicAngle,
  lengthSquared,
  pointOnCircularArc,
  subtract,
  tangentAtEndpoint,
} from "..";

describe("geodesic construction", () => {
  it("classifies origin-collinear points as a diameter", () => {
    const result = createGeodesicSegment({ x: -0.4, y: 0 }, { x: 0.6, y: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("diameter");
      expect(result.value.a).toEqual({ x: -0.4, y: 0 });
      expect(result.value.b).toEqual({ x: 0.6, y: 0 });
    }
  });

  it("uses the stable diameter fallback for near-collinear points", () => {
    const p = { x: 0.2, y: 0.1 };
    const q = { x: 0.4, y: 0.20000000001 };
    expect(areCollinearWithOrigin(p, q)).toBe(true);
    const result = createGeodesicSegment(p, q);
    expect(result.ok && result.value.kind === "diameter").toBe(true);
  });

  it("constructs an orthogonal circle and selects its interior arc", () => {
    const p = { x: 0.2, y: 0.4 };
    const q = { x: -0.45, y: 0.1 };
    const result = createGeodesicSegment(p, q);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "circle") return;
    const { circle } = result.value;
    expect(distance(p, circle.center)).toBeCloseTo(circle.radius, 8);
    expect(distance(q, circle.center)).toBeCloseTo(circle.radius, 8);
    expect(lengthSquared(circle.center) - circle.radius ** 2).toBeCloseTo(1, 8);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const sample = pointOnCircularArc(result.value, t);
      expect(sample.ok).toBe(true);
      if (sample.ok) expect(lengthSquared(sample.value)).toBeLessThan(1);
    }
  });

  it("rejects coincident points", () => {
    expect(createGeodesicSegment({ x: 0.2, y: 0.2 }, { x: 0.2, y: 0.2 })).toMatchObject({
      ok: false,
      code: "COINCIDENT_POINTS",
    });
  });
});

describe("tangents and conformal angles", () => {
  it("orients a diameter tangent toward the neighboring endpoint", () => {
    const geodesic = createGeodesicSegment({ x: -0.2, y: 0 }, { x: 0.7, y: 0 });
    if (!geodesic.ok) throw new Error(geodesic.message);
    const tangent = tangentAtEndpoint(
      geodesic.value,
      geodesic.value.a,
      geodesic.value.b,
    );
    expect(tangent).toEqual({ ok: true, value: { x: 1, y: 0 } });
  });

  it("makes a circular tangent perpendicular to its radius and point toward its neighbor", () => {
    const geodesic = createGeodesicSegment({ x: 0.2, y: 0.4 }, { x: -0.45, y: 0.1 });
    if (!geodesic.ok || geodesic.value.kind !== "circle") {
      throw new Error("Expected a circular geodesic");
    }
    const tangent = tangentAtEndpoint(
      geodesic.value,
      geodesic.value.a,
      geodesic.value.b,
    );
    if (!tangent.ok) throw new Error(tangent.message);
    const radius = subtract(geodesic.value.a, geodesic.value.circle.center);
    const toward = subtract(geodesic.value.b, geodesic.value.a);
    expect(dot(tangent.value, radius)).toBeCloseTo(0, 9);
    expect(dot(tangent.value, toward)).toBeGreaterThan(0);
  });

  it("returns the same angle when incident sides are swapped", () => {
    const a = { x: 0.1, y: 0.4 };
    const b = { x: -0.3, y: -0.2 };
    const c = { x: 0.5, y: -0.15 };
    const first = hyperbolicAngle(a, b, c);
    const swapped = hyperbolicAngle(a, c, b);
    expect(first.ok && swapped.ok).toBe(true);
    if (first.ok && swapped.ok) {
      expect(first.value).toBeGreaterThan(0);
      expect(first.value).toBeLessThan(Math.PI);
      expect(first.value).toBeCloseTo(swapped.value, 12);
    }
  });
});
