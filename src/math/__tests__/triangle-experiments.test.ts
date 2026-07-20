import { describe, expect, it } from "vitest";
import {
  generateRadialTriangleSeries,
  generateRadiusDistanceSeries,
  solveHyperbolicTriangle,
} from "..";
import type { HyperbolicTriangle, TriangleVertices } from "..";

const symmetricVertices = (radius: number): TriangleVertices => [
  { x: 0, y: radius },
  { x: radius * Math.cos((7 * Math.PI) / 6), y: radius * Math.sin((7 * Math.PI) / 6) },
  { x: radius * Math.cos((11 * Math.PI) / 6), y: radius * Math.sin((11 * Math.PI) / 6) },
];

const solve = (vertices: TriangleVertices): HyperbolicTriangle => {
  const result = solveHyperbolicTriangle(vertices);
  if (!result.ok) throw new Error(result.message);
  return result.value;
};

describe("hyperbolic triangle solver", () => {
  it("uses the documented side and angle ordering", () => {
    const vertices: TriangleVertices = [
      { x: 0.1, y: 0.35 },
      { x: -0.4, y: -0.1 },
      { x: 0.3, y: -0.2 },
    ];
    const triangle = solve(vertices);
    expect(triangle.sides[0].a).toEqual(vertices[1]);
    expect(triangle.sides[0].b).toEqual(vertices[2]);
    expect(triangle.sides[1].a).toEqual(vertices[2]);
    expect(triangle.sides[1].b).toEqual(vertices[0]);
    expect(triangle.sides[2].a).toEqual(vertices[0]);
    expect(triangle.sides[2].b).toEqual(vertices[1]);
  });

  it("solves a symmetric triangle with equal angles", () => {
    const triangle = solve(symmetricVertices(0.5));
    expect(triangle.angles[0]).toBeCloseTo(triangle.angles[1], 8);
    expect(triangle.angles[1]).toBeCloseTo(triangle.angles[2], 8);
    expect(triangle.angleSum).toBeLessThan(Math.PI);
    expect(triangle.defect).toBeGreaterThan(0);
    expect(triangle.area).toBeCloseTo(triangle.defect, 12);
  });

  it("shows increasing defect and the near-ideal limit", () => {
    const nearCenter = solve(symmetricVertices(0.1));
    const boundary = solve(symmetricVertices(0.9));
    const nearIdeal = solve(symmetricVertices(0.995));
    expect(Math.PI - nearCenter.angleSum).toBeLessThan(0.06);
    expect(nearCenter.defect).toBeLessThan(boundary.defect);
    expect(boundary.defect).toBeLessThan(nearIdeal.defect);
    expect(nearIdeal.angleSum).toBeLessThan(0.1);
    expect(nearIdeal.area).toBeCloseTo(Math.PI, 1);
  });

  it("agrees with the hyperbolic law of cosines", () => {
    const triangle = solve(symmetricVertices(0.65));
    const [a, b, c] = triangle.sideLengths;
    const [alpha] = triangle.angles;
    const recoveredCosine =
      (Math.cosh(b) * Math.cosh(c) - Math.cosh(a)) /
      (Math.sinh(b) * Math.sinh(c));
    expect(Math.cos(alpha)).toBeCloseTo(recoveredCosine, 7);
  });

  it("rejects a degenerate triangle", () => {
    const result = solveHyperbolicTriangle([
      { x: -0.5, y: 0 },
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
    ]);
    expect(result).toMatchObject({ ok: false, code: "DEGENERATE_TRIANGLE" });
  });
});

describe("deterministic experiment series", () => {
  it("generates a finite monotonic radius-distance series", () => {
    const result = generateRadiusDistanceSeries({ sampleCount: 20 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.samples).toHaveLength(20);
    for (let index = 1; index < result.value.samples.length; index += 1) {
      const previous = result.value.samples[index - 1];
      const current = result.value.samples[index];
      expect(current?.distance).toBeGreaterThan(previous?.distance ?? -1);
      expect(Number.isFinite(current?.distance)).toBe(true);
    }
  });

  it("generates same-shape triangle measurements without invalid values", () => {
    const result = generateRadialTriangleSeries({ sampleCount: 24, presetId: "test" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.samples).toHaveLength(24);
    expect(result.value.presetId).toBe("test");
    for (const sample of result.value.samples) {
      expect([sample.radius, sample.angleSum, sample.defect, sample.area].every(Number.isFinite)).toBe(true);
      expect(sample.area).toBeCloseTo(sample.defect, 12);
    }
  });

  it("rejects malformed experiment configuration", () => {
    expect(generateRadiusDistanceSeries({ sampleCount: 1 }).ok).toBe(false);
    expect(generateRadialTriangleSeries({ maxRadius: 1 }).ok).toBe(false);
    expect(
      generateRadialTriangleSeries({ directionAngles: [0, Number.NaN, 2] }).ok,
    ).toBe(false);
  });
});
