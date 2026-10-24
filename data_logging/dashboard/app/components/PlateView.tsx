import { PLATE_HALF_MM, fmt } from "../config";
import type { Sample } from "../config";

const HALF = PLATE_HALF_MM;
const TRAIL = 50; // last 50 samples, about 2 to 3 s
const GRID = [-90, -60, -30, 0, 30, 60, 90];

// The SVG y axis points down, the plate y axis points up, so every y is negated.
export default function PlateView({ samples, connected }: { samples: Sample[]; connected: boolean }) {
  const last = samples.length > 0 ? samples[samples.length - 1] : undefined;

  const info = [
    ["X", `${fmt(last?.x_mm)} mm`],
    ["Y", `${fmt(last?.y_mm)} mm`],
    ["Tilt X", `${fmt(last?.u_x_deg)}°`],
    ["Tilt Y", `${fmt(last?.u_y_deg)}°`],
    ["Status", connected ? "Connected" : "Not connected"],
  ];

  return (
    <div>
      <svg viewBox={`${-HALF - 10} ${-HALF - 10} ${2 * HALF + 20} ${2 * HALF + 20}`} className="mx-auto block w-full max-w-md bg-panel">
        <title>Plate seen from above with the ball, its trail and the setpoint</title>
        <rect x={-HALF} y={-HALF} width={2 * HALF} height={2 * HALF} fill="none" stroke="var(--muted)" />
        {GRID.map((g) => (
          <g key={g} stroke="var(--line)">
            <line x1={g} y1={-HALF} x2={g} y2={HALF} />
            <line x1={-HALF} y1={g} x2={HALF} y2={g} />
          </g>
        ))}
        {last && (
          <>
            {samples.slice(-TRAIL).map((s) => (
              <circle key={s.t_ms} cx={s.x_mm} cy={-s.y_mm} r="2" fill="var(--ink)" opacity="0.3" />
            ))}
            <circle cx={last.sp_x_mm} cy={-last.sp_y_mm} r="10" fill="none" stroke="var(--accent)" strokeWidth="2" />
            <circle cx={last.x_mm} cy={-last.y_mm} r="6" fill="var(--ink)" />
          </>
        )}
      </svg>

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {info.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-mono">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
