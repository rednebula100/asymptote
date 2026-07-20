# ASYMPTOTE

ASYMPTOTE is an interactive educational explorer for the Poincaré disk model of hyperbolic geometry at fixed Gaussian curvature `K = -1`.

Version 1 is a browser-only React application. It has no backend, accounts, external data services, alternate geometry models, or curvature control.

## Features

- Geodesic lab with diameter and orthogonal-circle classification
- Triangle lab with draggable and keyboard-adjustable vertices
- Live side lengths, conformal interior angles, angle sum, defect, and hyperbolic area
- Interaction-safe radial projection at `r = 0.995`
- Near-center, boundary, near-ideal, diameter, and circular-geodesic presets
- Deterministic 120-sample experiments for:
  - radius vs distance
  - radius vs angle sum
  - radius vs defect
  - radius vs area
  - defect vs area
- Raw-value triangle snapshots with recomputation-based integrity checks
- Standards-friendly CSV export with explicit units
- Responsive dark interface, keyboard point movement, reduced-motion support, and collapsible mobile panels

The defect-versus-area view is explicitly a visualization of the implemented Gauss–Bonnet relation. Since Version 1 computes area from angular defect, this graph is not an independent numerical proof.

## Architecture

```text
src/
├── math/          Pure, deterministic geometry engine with no React, DOM, SVG, or pixel dependencies
├── rendering/     Screen-to-mathematical coordinate conversion
├── components/    SVG canvas, measurements, controls, graphs, and snapshots
├── data/          Documented experiment preset coordinates
├── utils/         Presentation formatting and snapshot/CSV workflows
└── test/          Integration, data-flow, and rendering-boundary tests
```

The math engine uses immutable TypeScript interfaces and discriminated `MathResult<T>` values for expected calculation failures. Raw mathematical values remain unrounded; rounding is limited to display formatting. Invalid or non-finite values are rejected before they can reach application state, SVG output, graphs, snapshots, or CSV rows.

## Local development

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Validation

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Tests cover vector operations, validation, radial projection, hyperbolic distance, geodesic construction and arc selection, tangents, conformal angles, triangle invariants, Gauss–Bonnet area, deterministic experiments, regression cases, screen-coordinate isolation, keyboard/pointer interaction, graph disclosure, snapshots, restore integrity, and CSV output.

## Mathematical model

The implementation follows the exact open unit disk model:

```text
D = {(x, y) ∈ R² : x² + y² < 1}
```

The boundary represents points at infinity and is never stored as a draggable finite point. Internally, angles use radians. Hyperbolic triangle area is expressed in curvature-normalized `K = -1` units.
