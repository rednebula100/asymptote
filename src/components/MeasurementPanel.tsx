import type {
  GeodesicSegment,
  HyperbolicTriangle,
  MathResult,
} from "../math";
import type { LabMode } from "../data/presets";
import { formatDegrees, formatNumber } from "../utils/format";

interface MeasurementPanelProps {
  readonly mode: LabMode;
  readonly triangle: MathResult<HyperbolicTriangle>;
  readonly geodesic: MathResult<GeodesicSegment>;
  readonly geodesicDistance: MathResult<number>;
}

function ErrorNotice({ result }: { readonly result: { readonly ok: false; readonly message: string } }) {
  return (
    <div className="math-error" role="alert">
      <span aria-hidden="true">!</span>
      <div>
        <strong>Geometry needs adjustment</strong>
        <p>{result.message}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail?: string }) {
  return (
    <div className="metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
      {detail !== undefined && <span>{detail}</span>}
    </div>
  );
}

export function MeasurementPanel({
  mode,
  triangle,
  geodesic,
  geodesicDistance,
}: MeasurementPanelProps) {
  if (mode === "geodesic") {
    if (!geodesic.ok) return <ErrorNotice result={geodesic} />;
    if (!geodesicDistance.ok) return <ErrorNotice result={geodesicDistance} />;
    return (
      <div className="measurement-content">
        <div className="measurement-hero">
          <span>Hyperbolic distance</span>
          <strong data-testid="geodesic-distance">{formatNumber(geodesicDistance.value, 5)}</strong>
          <small>curvature-normalized length</small>
        </div>
        <dl className="metric-grid compact">
          <Metric
            label="Geodesic type"
            value={geodesic.value.kind === "diameter" ? "Diameter" : "Orthogonal arc"}
          />
          {geodesic.value.kind === "circle" && (
            <Metric label="Support radius" value={formatNumber(geodesic.value.circle.radius)} />
          )}
        </dl>
        <p className="panel-note">
          A straight segment appears only when both points are collinear with the origin.
          Every other geodesic follows a circle orthogonal to the boundary.
        </p>
      </div>
    );
  }

  if (!triangle.ok) return <ErrorNotice result={triangle} />;
  const [sideA, sideB, sideC] = triangle.value.sideLengths;
  const [alpha, beta, gamma] = triangle.value.angles;
  return (
    <div className="measurement-content">
      <div className="measurement-hero split">
        <div>
          <span>Angle sum</span>
          <strong data-testid="angle-sum">{formatDegrees(triangle.value.angleSum)}</strong>
        </div>
        <div>
          <span>Defect</span>
          <strong>{formatDegrees(triangle.value.defect)}</strong>
        </div>
      </div>
      <div className="metric-section">
        <p className="eyebrow">Side lengths</p>
        <dl className="metric-grid three">
          <Metric label="a · BC" value={formatNumber(sideA)} />
          <Metric label="b · CA" value={formatNumber(sideB)} />
          <Metric label="c · AB" value={formatNumber(sideC)} />
        </dl>
      </div>
      <div className="metric-section">
        <p className="eyebrow">Interior angles</p>
        <dl className="metric-grid three">
          <Metric label="α · A" value={formatDegrees(alpha)} />
          <Metric label="β · B" value={formatDegrees(beta)} />
          <Metric label="γ · C" value={formatDegrees(gamma)} />
        </dl>
      </div>
      <dl className="area-metric">
        <dt>Hyperbolic area <span>(K = −1 units)</span></dt>
        <dd>{formatNumber(triangle.value.area, 5)}</dd>
      </dl>
    </div>
  );
}
