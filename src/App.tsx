import { useMemo, useState } from "react";
import { ExperimentControls } from "./components/ExperimentControls";
import { GeometryCanvas } from "./components/GeometryCanvas";
import { GraphPanel } from "./components/GraphPanel";
import { MeasurementPanel } from "./components/MeasurementPanel";
import { SnapshotHistory } from "./components/SnapshotHistory";
import {
  INTERACTION_MAX_RADIUS,
  createGeodesicSegment,
  directionAnglesForTriangle,
  failure,
  generateRadialTriangleSeries,
  generateRadiusDistanceSeries,
  hyperbolicDistance,
  maxVertexRadius,
  projectToRadius,
  solveHyperbolicTriangle,
} from "./math";
import type {
  MathResult,
  Point2,
  RadialTriangleSeries,
  TriangleSnapshot,
  TriangleVertices,
} from "./math";
import {
  DEFAULT_VERTICES,
  PRESETS,
} from "./data/presets";
import type { ExperimentPreset, LabMode } from "./data/presets";
import {
  createTriangleSnapshot,
  restoreTriangleSnapshot,
  snapshotsToCsv,
} from "./utils/snapshots";

const cloneVertices = (vertices: TriangleVertices): TriangleVertices => [
  { ...vertices[0] },
  { ...vertices[1] },
  { ...vertices[2] },
];

const replaceVertex = (
  vertices: TriangleVertices,
  index: number,
  point: Point2,
): TriangleVertices => {
  if (index === 0) return [{ ...point }, { ...vertices[1] }, { ...vertices[2] }];
  if (index === 1) return [{ ...vertices[0] }, { ...point }, { ...vertices[2] }];
  if (index === 2) return [{ ...vertices[0] }, { ...vertices[1] }, { ...point }];
  return cloneVertices(vertices);
};

function Panel({
  id,
  title,
  subtitle,
  className = "",
  collapsible = false,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly className?: string;
  readonly collapsible?: boolean;
  readonly children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section className={`panel ${className} ${expanded ? "" : "collapsed"}`} aria-labelledby={id}>
      <div className="panel-header">
        <div>
          <p className="panel-kicker">{subtitle}</p>
          <h2 id={id}>{title}</h2>
        </div>
        <span className="panel-rule" aria-hidden="true" />
        {collapsible && (
          <button
            type="button"
            className="panel-toggle"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export default function App() {
  const [mode, setMode] = useState<LabMode>("triangle");
  const [vertices, setVertices] = useState<TriangleVertices>(() =>
    cloneVertices(DEFAULT_VERTICES),
  );
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState("custom");
  const [snapshots, setSnapshots] = useState<readonly TriangleSnapshot[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const triangle = useMemo(() => solveHyperbolicTriangle(vertices), [vertices]);
  const geodesic = useMemo(
    () => createGeodesicSegment(vertices[0], vertices[1]),
    [vertices],
  );
  const geodesicDistance = useMemo(
    () => hyperbolicDistance(vertices[0], vertices[1]),
    [vertices],
  );
  const currentMaxRadius = useMemo(() => maxVertexRadius(vertices), [vertices]);
  const distanceSeries = useMemo(() => generateRadiusDistanceSeries(), []);
  const triangleSeries = useMemo((): MathResult<RadialTriangleSeries> => {
    const directions = directionAnglesForTriangle(vertices);
    if (!directions.ok) {
      return failure(directions.code, directions.message);
    }
    return generateRadialTriangleSeries({
      directionAngles: directions.value,
      presetId: activePreset,
    });
  }, [activePreset, vertices]);

  const moveVertex = (index: number, rawPoint: Point2): void => {
    const projected = projectToRadius(rawPoint, INTERACTION_MAX_RADIUS);
    if (!projected.ok) {
      setStatus(projected.message);
      return;
    }
    setVertices((current) => replaceVertex(current, index, projected.value));
    setActivePreset("custom");
    setStatus(null);
  };

  const applyPreset = (preset: ExperimentPreset): void => {
    setVertices(cloneVertices(preset.vertices));
    setMode(preset.mode);
    setActivePreset(preset.id);
    setSelectedVertex(null);
    setStatus(`${preset.name} loaded.`);
  };

  const saveSnapshot = (): void => {
    if (mode !== "triangle" || !triangle.ok) {
      setStatus("Only a valid triangle can be saved.");
      return;
    }
    const createdAt = new Date().toISOString();
    const id = globalThis.crypto.randomUUID();
    const snapshot = createTriangleSnapshot(triangle.value, {
      id,
      label: `Run ${snapshots.length + 1}`,
      createdAt,
    });
    if (!snapshot.ok) {
      setStatus(snapshot.message);
      return;
    }
    setSnapshots((current) => [...current, snapshot.value]);
    setStatus(`${snapshot.value.label} saved with raw measurements.`);
  };

  const restoreSnapshot = (snapshot: TriangleSnapshot): void => {
    const restored = restoreTriangleSnapshot(snapshot);
    if (!restored.ok) {
      setStatus(restored.message);
      return;
    }
    setVertices(cloneVertices(restored.value.vertices));
    setMode("triangle");
    setActivePreset("restored");
    setStatus(`${snapshot.label} restored and integrity-checked.`);
  };

  const exportSnapshots = (): void => {
    const csv = snapshotsToCsv(snapshots);
    if (!csv.ok) {
      setStatus(csv.message);
      return;
    }
    const blob = new Blob([csv.value], { type: "text/csv;charset=utf-8" });
    let url: string;
    try {
      url = globalThis.URL.createObjectURL(blob);
    } catch {
      setStatus("CSV generation succeeded, but this browser cannot start the download.");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = `asymptote-snapshots-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    setStatus(`${snapshots.length} snapshot${snapshots.length === 1 ? "" : "s"} exported.`);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ASYMPTOTE home">
          <span className="brand-mark" aria-hidden="true">
            <i />
          </span>
          <span>
            <strong>ASYMPTOTE</strong>
            <small>Hyperbolic geometry explorer</small>
          </span>
        </a>
        <div className="header-model">
          <span className="status-light" aria-hidden="true" />
          Poincaré disk
          <b>K = −1</b>
        </div>
        <a className="header-link" href="#method">How it works</a>
      </header>

      <main id="top">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="overline">Interactive mathematics laboratory · Version 1.0</p>
            <h1 id="page-title">Geometry bends.<br /><em>Explore what follows.</em></h1>
          </div>
          <p className="intro-copy">
            Move finite points inside the Poincaré disk and watch exact hyperbolic
            distances, geodesics, angles, defect, and area respond in real time.
          </p>
        </section>

        {status !== null && (
          <div className="status-message" role="status">
            <span aria-hidden="true">●</span>{status}
            <button type="button" aria-label="Dismiss status" onClick={() => setStatus(null)}>×</button>
          </div>
        )}

        <section className="workspace" aria-label="Interactive geometry workspace">
          <Panel id="canvas-title" title={mode === "triangle" ? "Triangle canvas" : "Geodesic canvas"} subtitle="01 · Explore" className="canvas-panel">
            <GeometryCanvas
              mode={mode}
              vertices={vertices}
              triangle={triangle}
              geodesic={geodesic}
              selectedVertex={selectedVertex}
              onSelectVertex={setSelectedVertex}
              onMoveVertex={moveVertex}
            />
          </Panel>

          <aside className="side-stack" aria-label="Measurements and controls">
            <Panel id="measurements-title" title="Live measurements" subtitle="02 · Observe" collapsible>
              <MeasurementPanel
                mode={mode}
                triangle={triangle}
                geodesic={geodesic}
                geodesicDistance={geodesicDistance}
              />
            </Panel>
            <Panel id="controls-title" title="Experiments" subtitle="03 · Compare" collapsible>
              <ExperimentControls
                mode={mode}
                presets={PRESETS}
                activePreset={activePreset}
                onModeChange={(nextMode) => {
                  setMode(nextMode);
                  setStatus(null);
                }}
                onPreset={applyPreset}
              />
            </Panel>
          </aside>
        </section>

        <Panel id="graphs-title" title="Experiment graphs" subtitle="04 · Trace" className="wide-panel graph-panel" collapsible>
          <GraphPanel
            distanceSeries={distanceSeries}
            triangleSeries={triangleSeries}
            currentTriangle={triangle}
            currentMaxRadius={currentMaxRadius}
          />
        </Panel>

        <Panel id="snapshots-title" title="Snapshot history" subtitle="05 · Record" className="wide-panel snapshot-panel" collapsible>
          <SnapshotHistory
            snapshots={snapshots}
            canSave={mode === "triangle" && triangle.ok}
            onSave={saveSnapshot}
            onRestore={restoreSnapshot}
            onDelete={(id) => {
              setSnapshots((current) => current.filter((snapshot) => snapshot.id !== id));
              setStatus("Snapshot removed.");
            }}
            onExport={exportSnapshots}
          />
        </Panel>

        <section id="method" className="method-section" aria-labelledby="method-title">
          <div>
            <p className="overline">What you are seeing</p>
            <h2 id="method-title">A finite view of an infinite plane.</h2>
          </div>
          <div className="method-grid">
            <article>
              <span>01</span>
              <h3>The boundary is infinity</h3>
              <p>Points stop at interaction radius 0.995. The unit boundary at r = 1 is never a finite hyperbolic point.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Angles stay familiar</h3>
              <p>The disk is conformal, so the engine measures hyperbolic angles using Euclidean tangents to the displayed geodesics.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Defect becomes area</h3>
              <p>At fixed curvature K = −1, Gauss–Bonnet gives area equal to π minus the triangle’s angle sum.</p>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <span>ASYMPTOTE · Poincaré disk model</span>
        <span>Deterministic browser-only mathematics · K = −1</span>
      </footer>
    </div>
  );
}
