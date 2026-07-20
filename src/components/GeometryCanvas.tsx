import { useMemo, useRef } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  length,
  pointOnCircularArc,
} from "../math";
import type {
  GeodesicSegment,
  HyperbolicTriangle,
  MathResult,
  Point2,
  TriangleVertices,
} from "../math";
import type { LabMode } from "../data/presets";
import { CANVAS_EXTENT, clientPointToMath } from "../rendering/coordinates";

interface GeometryCanvasProps {
  readonly mode: LabMode;
  readonly vertices: TriangleVertices;
  readonly triangle: MathResult<HyperbolicTriangle>;
  readonly geodesic: MathResult<GeodesicSegment>;
  readonly selectedVertex: number | null;
  readonly onSelectVertex: (index: number | null) => void;
  readonly onMoveVertex: (index: number, point: Point2) => void;
}

const POINT_LABELS = ["A", "B", "C"] as const;
const POINT_CLASSES = ["point-a", "point-b", "point-c"] as const;

const pointLabel = (index: number): string => POINT_LABELS[index] ?? "Point";
const pointClass = (index: number): string => POINT_CLASSES[index] ?? "";

const sampleGeodesic = (geodesic: GeodesicSegment): readonly Point2[] | null => {
  if (geodesic.kind === "diameter") return [geodesic.a, geodesic.b];
  const points: Point2[] = [];
  for (let index = 0; index <= 56; index += 1) {
    const sample = pointOnCircularArc(geodesic, index / 56);
    if (!sample.ok) return null;
    points.push(sample.value);
  }
  return points;
};

const pointsToPath = (points: readonly Point2[], close = false): string | null => {
  if (
    points.length < 2 ||
    points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))
  ) {
    return null;
  }
  const [first, ...rest] = points;
  if (first === undefined) return null;
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")}${close ? " Z" : ""}`;
};

const renderGeodesicPath = (
  geodesic: GeodesicSegment,
  key: string,
  className = "geodesic-line",
) => {
  const points = sampleGeodesic(geodesic);
  const path = points === null ? null : pointsToPath(points);
  return path === null ? null : (
    <path key={key} d={path} className={className} vectorEffect="non-scaling-stroke" />
  );
};

export function GeometryCanvas({
  mode,
  vertices,
  triangle,
  geodesic,
  selectedVertex,
  onSelectVertex,
  onMoveVertex,
}: GeometryCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingIndex = useRef<number | null>(null);

  const triangleFillPath = useMemo(() => {
    if (!triangle.ok) return null;
    const points: Point2[] = [];
    for (const [sideIndex, side] of triangle.value.sides.entries()) {
      const sampled = sampleGeodesic(side);
      if (sampled === null) return null;
      points.push(...(sideIndex === 0 ? sampled : sampled.slice(1)));
    }
    return pointsToPath(points, true);
  }, [triangle]);

  const moveFromPointer = (event: ReactPointerEvent<SVGSVGElement>): void => {
    const index = draggingIndex.current;
    const svg = svgRef.current;
    if (index === null || svg === null) return;
    const bounds = svg.getBoundingClientRect();
    const point = clientPointToMath(event.clientX, event.clientY, bounds);
    if (point !== null) onMoveVertex(index, point);
  };

  const finishDrag = (): void => {
    draggingIndex.current = null;
  };

  const handleKeyDown = (
    event: KeyboardEvent<SVGCircleElement>,
    index: number,
  ): void => {
    const amount = event.shiftKey ? 0.003 : 0.015;
    const directions: Partial<Record<string, Point2>> = {
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 },
      ArrowUp: { x: 0, y: amount },
      ArrowDown: { x: 0, y: -amount },
    };
    const direction = directions[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    const current = vertices[index];
    if (current !== undefined) {
      onMoveVertex(index, {
        x: current.x + direction.x,
        y: current.y + direction.y,
      });
    }
  };

  const visibleVertices = mode === "triangle" ? vertices : vertices.slice(0, 2);

  return (
    <div className="canvas-frame">
      <div className="canvas-meta" aria-hidden="true">
        <span>OPEN UNIT DISK</span>
        <span>r &lt; 1</span>
      </div>
      <svg
        ref={svgRef}
        className="geometry-canvas"
        viewBox={`${-CANVAS_EXTENT} ${-CANVAS_EXTENT} ${2 * CANVAS_EXTENT} ${2 * CANVAS_EXTENT}`}
        role="application"
        aria-label={`${mode === "triangle" ? "Hyperbolic triangle" : "Hyperbolic geodesic"} canvas. Drag the labeled points or use arrow keys while a point is focused.`}
        onPointerMove={moveFromPointer}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={(event) => {
          if (event.buttons === 0) finishDrag();
        }}
      >
        <defs>
          <clipPath id="disk-clip">
            <circle cx="0" cy="0" r="1" />
          </clipPath>
        </defs>

        <g transform="scale(1 -1)">
          <circle className="disk-surface" cx="0" cy="0" r="1" />
          <g className="disk-grid" clipPath="url(#disk-clip)" aria-hidden="true">
            <circle cx="0" cy="0" r="0.25" />
            <circle cx="0" cy="0" r="0.5" />
            <circle cx="0" cy="0" r="0.75" />
            <line x1="-1" y1="0" x2="1" y2="0" />
            <line x1="0" y1="-1" x2="0" y2="1" />
          </g>
          {mode === "triangle" && triangle.ok && triangleFillPath !== null && (
            <path className="triangle-fill" d={triangleFillPath} />
          )}
          {mode === "triangle" && triangle.ok &&
            triangle.value.sides.map((side, index) =>
              renderGeodesicPath(side, `triangle-side-${index}`),
            )}
          {mode === "geodesic" && geodesic.ok &&
            renderGeodesicPath(geodesic.value, "active-geodesic", "geodesic-line geodesic-focus")}
          <circle className="disk-boundary" cx="0" cy="0" r="1" />
          <circle className="origin-mark" cx="0" cy="0" r="0.009" />

          {visibleVertices.map((vertex, index) => (
            <circle
              key={`handle-${pointLabel(index)}`}
              className={`point-handle ${pointClass(index)} ${selectedVertex === index ? "is-selected" : ""}`}
              cx={vertex.x}
              cy={vertex.y}
              r={selectedVertex === index ? 0.048 : 0.04}
              tabIndex={0}
              role="slider"
              aria-label={`Point ${pointLabel(index)}`}
              aria-valuemin={0}
              aria-valuemax={0.995}
              aria-valuenow={length(vertex)}
              aria-valuetext={`x ${vertex.x.toFixed(3)}, y ${vertex.y.toFixed(3)}`}
              onFocus={() => onSelectVertex(index)}
              onBlur={() => {
                if (draggingIndex.current === null) onSelectVertex(null);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPointerDown={(event) => {
                event.preventDefault();
                draggingIndex.current = index;
                onSelectVertex(index);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            />
          ))}
        </g>

        {visibleVertices.map((vertex, index) => (
          <text
            key={`label-${pointLabel(index)}`}
            className="point-label"
            x={vertex.x + 0.055}
            y={-vertex.y - 0.052}
            aria-hidden="true"
          >
            {pointLabel(index)}
          </text>
        ))}
      </svg>
      <div className="canvas-hint">
        <span className="pulse-dot" aria-hidden="true" />
        Drag points · Arrow keys move · Shift for fine control
      </div>
    </div>
  );
}
