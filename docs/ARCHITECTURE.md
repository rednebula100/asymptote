# ASYMPTOTE Architecture

## Dependency direction

The application has a one-way dependency boundary:

```text
math engine ← data and snapshot workflows ← React components
     ↑                                      ↑
     └──────── no screen concepts ──────────┘

screen coordinates → rendering conversion → mathematical points
```

`src/math` never imports React, DOM types, SVG code, browser time, random values, or screen coordinates. Its public interaction-facing calculations return `MathResult<T>` so expected invalid geometry is data rather than an uncaught exception.

## Math modules

- `constants.ts`: shared tolerances, model identifiers, and interaction radius
- `types.ts`: immutable points, geodesics, triangles, experiment samples, and snapshots
- `vector.ts`: finite-checked Euclidean vector primitives
- `validation.ts`: finite values, open-disk checks, and narrow floating-point clamps
- `projection.ts`: direction-preserving interaction projection
- `distance.ts`: closed-form Poincaré metric distance
- `geodesic.ts`: diameter classification, orthogonal circles, and interior arc selection
- `tangent.ts` / `angle.ts`: conformal tangent-angle calculation
- `triangle.ts`: ordered sides and angles, defect, area, and invariants
- `experiments.ts`: reproducible radius sweeps and radial triangle families

## Safety policy

- The low-level engine never clamps a boundary point into the interaction region.
- Interaction projection occurs before vertex state is updated.
- A failed solve replaces measurements with a visible structured error; stale values are not shown.
- Graph series fail as structured data instead of inserting invalid samples.
- Snapshots store raw values and are recomputed from vertices when restored.
- CSV generation checks every numeric cell for finiteness.

## Rendering policy

Mathematical coordinates are Cartesian with positive `y` upward. The SVG layer performs the display inversion. Circular geodesics are sampled through the engine's `pointOnCircularArc` function, keeping circle and arc formulas out of React components.
