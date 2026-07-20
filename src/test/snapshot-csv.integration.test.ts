import { describe, expect, it } from "vitest";
import { solveHyperbolicTriangle } from "../math";
import type { TriangleSnapshot } from "../math";
import {
  createTriangleSnapshot,
  restoreTriangleSnapshot,
  snapshotsToCsv,
} from "../utils/snapshots";

const makeSnapshot = (): TriangleSnapshot => {
  const triangle = solveHyperbolicTriangle([
    { x: 0.08, y: 0.62 },
    { x: -0.58, y: -0.28 },
    { x: 0.51, y: -0.36 },
  ]);
  if (!triangle.ok) throw new Error(triangle.message);
  const snapshot = createTriangleSnapshot(triangle.value, {
    id: "test-run",
    label: "Run 1",
    createdAt: "2026-07-21T00:00:00.000Z",
  });
  if (!snapshot.ok) throw new Error(snapshot.message);
  return snapshot.value;
};

describe("snapshot and CSV data flow", () => {
  it("restores a snapshot by recomputing its stored vertices", () => {
    const snapshot = makeSnapshot();
    const restored = restoreTriangleSnapshot(snapshot);
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(restored.value.area).toBeCloseTo(snapshot.area, 10);
  });

  it("rejects a snapshot that fails its measurement integrity check", () => {
    const snapshot = makeSnapshot();
    const tampered: TriangleSnapshot = { ...snapshot, area: snapshot.area + 0.1 };
    expect(restoreTriangleSnapshot(tampered)).toMatchObject({
      ok: false,
      code: "INVALID_RESULT",
    });
  });

  it("exports the documented raw columns without invalid numeric values", () => {
    const csv = snapshotsToCsv([makeSnapshot()]);
    expect(csv.ok).toBe(true);
    if (!csv.ok) return;
    expect(csv.value).toContain("angle_alpha_rad");
    expect(csv.value).toContain("max_vertex_radius");
    expect(csv.value).toContain("poincare-disk");
    expect(csv.value).not.toMatch(/NaN|Infinity/);
    expect(csv.value.trim().split("\n")).toHaveLength(2);
  });

  it("requires at least one saved experiment before export", () => {
    expect(snapshotsToCsv([]).ok).toBe(false);
  });
});
