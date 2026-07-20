import type { ExperimentPreset, LabMode } from "../data/presets";

interface ExperimentControlsProps {
  readonly mode: LabMode;
  readonly presets: readonly ExperimentPreset[];
  readonly activePreset: string;
  readonly onModeChange: (mode: LabMode) => void;
  readonly onPreset: (preset: ExperimentPreset) => void;
}

export function ExperimentControls({
  mode,
  presets,
  activePreset,
  onModeChange,
  onPreset,
}: ExperimentControlsProps) {
  return (
    <div className="controls-content">
      <div className="segmented-control" aria-label="Lab mode">
        <button
          type="button"
          className={mode === "triangle" ? "active" : ""}
          aria-pressed={mode === "triangle"}
          onClick={() => onModeChange("triangle")}
        >
          Triangle lab
        </button>
        <button
          type="button"
          className={mode === "geodesic" ? "active" : ""}
          aria-pressed={mode === "geodesic"}
          onClick={() => onModeChange("geodesic")}
        >
          Geodesic lab
        </button>
      </div>
      <div className="preset-list">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`preset-button ${activePreset === preset.id ? "active" : ""}`}
            aria-pressed={activePreset === preset.id}
            onClick={() => onPreset(preset)}
          >
            <span>{preset.name}</span>
            <small>{preset.description}</small>
            <i aria-hidden="true">→</i>
          </button>
        ))}
      </div>
    </div>
  );
}
