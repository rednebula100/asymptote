import { useMemo, useState } from "react";
import type {
  HyperbolicTriangle,
  MathResult,
  RadialTriangleSeries,
  RadiusDistanceSeries,
} from "../math";
import { formatNumber } from "../utils/format";

type GraphKind =
  | "radius-distance"
  | "radius-angle-sum"
  | "radius-defect"
  | "radius-area"
  | "defect-area";

interface GraphDefinition {
  readonly id: GraphKind;
  readonly shortLabel: string;
  readonly title: string;
  readonly xLabel: string;
  readonly yLabel: string;
}

const GRAPHS: readonly GraphDefinition[] = [
  {
    id: "radius-distance",
    shortLabel: "Distance",
    title: "Radius vs hyperbolic distance",
    xLabel: "Euclidean radius r",
    yLabel: "Hyperbolic distance from origin",
  },
  {
    id: "radius-angle-sum",
    shortLabel: "Angle sum",
    title: "Max vertex radius vs angle sum",
    xLabel: "Radial family radius",
    yLabel: "Angle sum (radians)",
  },
  {
    id: "radius-defect",
    shortLabel: "Defect",
    title: "Max vertex radius vs angular defect",
    xLabel: "Radial family radius",
    yLabel: "Defect (radians)",
  },
  {
    id: "radius-area",
    shortLabel: "Area",
    title: "Max vertex radius vs hyperbolic area",
    xLabel: "Radial family radius",
    yLabel: "Area (K = −1 units)",
  },
  {
    id: "defect-area",
    shortLabel: "D ↔ A",
    title: "Defect vs hyperbolic area",
    xLabel: "Defect (radians)",
    yLabel: "Area (K = −1 units)",
  },
] as const;

interface ChartDatum {
  readonly x: number;
  readonly y: number;
}

interface LineChartProps {
  readonly title: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly data: readonly ChartDatum[];
  readonly marker: ChartDatum | null;
}

function LineChart({ title, xLabel, yLabel, data, marker }: LineChartProps) {
  const finiteData = data.filter(
    (datum) => Number.isFinite(datum.x) && Number.isFinite(datum.y),
  );
  if (finiteData.length < 2) {
    return <div className="chart-error">A valid numeric series is not available.</div>;
  }

  const width = 860;
  const height = 330;
  const margin = { top: 24, right: 24, bottom: 58, left: 72 } as const;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xValues = finiteData.map((datum) => datum.x);
  const yValues = finiteData.map((datum) => datum.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(0, ...yValues);
  const rawYMax = Math.max(...yValues);
  const yMax = rawYMax === yMin ? yMin + 1 : rawYMax * 1.05;
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const toX = (value: number) => margin.left + ((value - xMin) / xSpan) * plotWidth;
  const toY = (value: number) => margin.top + plotHeight - ((value - yMin) / ySpan) * plotHeight;
  const path = finiteData
    .map((datum, index) => `${index === 0 ? "M" : "L"} ${toX(datum.x)} ${toY(datum.y)}`)
    .join(" ");
  const ticks = Array.from({ length: 5 }, (_, index) => index / 4);
  const finiteMarker =
    marker !== null && Number.isFinite(marker.x) && Number.isFinite(marker.y)
      ? marker
      : null;

  return (
    <div className="chart-wrap">
      <svg
        className="line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}. ${finiteData.length} deterministic samples.`}
      >
        <g className="chart-grid" aria-hidden="true">
          {ticks.map((tick) => {
            const y = margin.top + plotHeight - tick * plotHeight;
            const value = yMin + tick * ySpan;
            return (
              <g key={`y-${tick}`}>
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} />
                <text x={margin.left - 12} y={y + 4} textAnchor="end">
                  {formatNumber(value, 2)}
                </text>
              </g>
            );
          })}
          {ticks.map((tick) => {
            const x = margin.left + tick * plotWidth;
            const value = xMin + tick * xSpan;
            return (
              <g key={`x-${tick}`}>
                <line x1={x} y1={margin.top} x2={x} y2={margin.top + plotHeight} />
                <text x={x} y={height - 34} textAnchor="middle">
                  {formatNumber(value, 2)}
                </text>
              </g>
            );
          })}
        </g>
        <path className="chart-line-halo" d={path} />
        <path className="chart-line" d={path} />
        {finiteMarker !== null && (
          <g className="chart-marker" transform={`translate(${toX(finiteMarker.x)} ${toY(finiteMarker.y)})`}>
            <circle r="10" />
            <circle r="4" />
          </g>
        )}
        <text className="axis-label x-axis-label" x={margin.left + plotWidth / 2} y={height - 7} textAnchor="middle">
          {xLabel}
        </text>
        <text
          className="axis-label y-axis-label"
          x={-(margin.top + plotHeight / 2)}
          y="17"
          textAnchor="middle"
          transform="rotate(-90)"
        >
          {yLabel}
        </text>
      </svg>
      {finiteMarker !== null && (
        <div className="chart-current" aria-label="Current geometry marker">
          <span>Current</span>
          <b>x {formatNumber(finiteMarker.x, 3)}</b>
          <b>y {formatNumber(finiteMarker.y, 3)}</b>
        </div>
      )}
    </div>
  );
}

interface GraphPanelProps {
  readonly distanceSeries: MathResult<RadiusDistanceSeries>;
  readonly triangleSeries: MathResult<RadialTriangleSeries>;
  readonly currentTriangle: MathResult<HyperbolicTriangle>;
  readonly currentMaxRadius: MathResult<number>;
}

export function GraphPanel({
  distanceSeries,
  triangleSeries,
  currentTriangle,
  currentMaxRadius,
}: GraphPanelProps) {
  const [activeGraph, setActiveGraph] = useState<GraphKind>("radius-distance");
  const definition = GRAPHS.find((graph) => graph.id === activeGraph);
  if (definition === undefined) {
    throw new Error("Unknown graph selection.");
  }

  const chart = useMemo((): { data: readonly ChartDatum[]; marker: ChartDatum | null; error: string | null } => {
    if (activeGraph === "radius-distance") {
      if (!distanceSeries.ok) return { data: [], marker: null, error: distanceSeries.message };
      return {
        data: distanceSeries.value.samples.map((sample) => ({ x: sample.radius, y: sample.distance })),
        marker: null,
        error: null,
      };
    }
    if (!triangleSeries.ok) return { data: [], marker: null, error: triangleSeries.message };
    const sampleData = triangleSeries.value.samples.map((sample) => {
      if (activeGraph === "radius-angle-sum") return { x: sample.radius, y: sample.angleSum };
      if (activeGraph === "radius-defect") return { x: sample.radius, y: sample.defect };
      if (activeGraph === "radius-area") return { x: sample.radius, y: sample.area };
      return { x: sample.defect, y: sample.area };
    });
    if (!currentTriangle.ok || !currentMaxRadius.ok) {
      return { data: sampleData, marker: null, error: null };
    }
    const marker = activeGraph === "radius-angle-sum"
      ? { x: currentMaxRadius.value, y: currentTriangle.value.angleSum }
      : activeGraph === "radius-defect"
        ? { x: currentMaxRadius.value, y: currentTriangle.value.defect }
        : activeGraph === "radius-area"
          ? { x: currentMaxRadius.value, y: currentTriangle.value.area }
          : { x: currentTriangle.value.defect, y: currentTriangle.value.area };
    return { data: sampleData, marker, error: null };
  }, [activeGraph, currentMaxRadius, currentTriangle, distanceSeries, triangleSeries]);

  return (
    <div className="graph-content">
      <div className="graph-tabs" role="tablist" aria-label="Experiment graph">
        {GRAPHS.map((graph) => (
          <button
            key={graph.id}
            type="button"
            role="tab"
            aria-selected={activeGraph === graph.id}
            className={activeGraph === graph.id ? "active" : ""}
            onClick={() => setActiveGraph(graph.id)}
          >
            {graph.shortLabel}
          </button>
        ))}
      </div>
      <div className="graph-heading">
        <div>
          <p className="eyebrow">Deterministic sweep · 120 samples</p>
          <h3>{definition.title}</h3>
        </div>
        <span className="model-badge">K = −1</span>
      </div>
      {chart.error === null ? (
        <LineChart
          title={definition.title}
          xLabel={definition.xLabel}
          yLabel={definition.yLabel}
          data={chart.data}
          marker={chart.marker}
        />
      ) : (
        <div className="chart-error" role="alert">{chart.error}</div>
      )}
      {activeGraph === "radius-distance" && (
        <p className="graph-explanation">
          Equal Euclidean steps cover increasing hyperbolic distance as the point approaches
          the model boundary. The boundary itself remains unreachable.
        </p>
      )}
      {activeGraph !== "radius-distance" && activeGraph !== "defect-area" && (
        <p className="graph-explanation">
          This sweep preserves the current three vertex directions and expands them together.
          “Radius” therefore means the family’s explicit common radial parameter.
        </p>
      )}
      {activeGraph === "defect-area" && (
        <div className="scientific-note">
          <strong>Gauss–Bonnet visualization, not an independent proof</strong>
          <p>
            Version 1 computes area directly from A = π − (α + β + γ), so every valid point
            lies on A = D. Independent verification would require numerical area integration,
            which is outside this version’s scope.
          </p>
        </div>
      )}
    </div>
  );
}
