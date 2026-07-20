import type { TriangleSnapshot } from "../math";
import { formatDegrees, formatNumber, formatTimestamp } from "../utils/format";

interface SnapshotHistoryProps {
  readonly snapshots: readonly TriangleSnapshot[];
  readonly canSave: boolean;
  readonly onSave: () => void;
  readonly onRestore: (snapshot: TriangleSnapshot) => void;
  readonly onDelete: (id: string) => void;
  readonly onExport: () => void;
}

export function SnapshotHistory({
  snapshots,
  canSave,
  onSave,
  onRestore,
  onDelete,
  onExport,
}: SnapshotHistoryProps) {
  return (
    <div className="snapshot-content">
      <div className="snapshot-actions">
        <button type="button" className="primary-button" disabled={!canSave} onClick={onSave}>
          <span aria-hidden="true">＋</span> Save current triangle
        </button>
        <button type="button" className="secondary-button" disabled={snapshots.length === 0} onClick={onExport}>
          Export CSV
        </button>
      </div>
      {snapshots.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">◇</span>
          <div>
            <strong>No snapshots yet</strong>
            <p>Save triangles to compare exact, unrounded experiment data.</p>
          </div>
        </div>
      ) : (
        <div className="snapshot-table-wrap">
          <table className="snapshot-table">
            <thead>
              <tr>
                <th>Run</th>
                <th>Angle sum</th>
                <th>Defect</th>
                <th>Area</th>
                <th>Max radius</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td>
                    <strong>{snapshot.label}</strong>
                    <small>{formatTimestamp(snapshot.createdAt)}</small>
                  </td>
                  <td>{formatDegrees(snapshot.angleSumRadians)}</td>
                  <td>{formatDegrees(snapshot.defectRadians)}</td>
                  <td>{formatNumber(snapshot.area)}</td>
                  <td>{formatNumber(snapshot.maxVertexRadius, 3)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => onRestore(snapshot)} aria-label={`Restore ${snapshot.label}`}>
                        Restore
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(snapshot.id)} aria-label={`Delete ${snapshot.label}`}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
