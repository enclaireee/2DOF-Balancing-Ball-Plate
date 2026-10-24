import type { Sample } from "../config";

const W = 600;
const H = 200;

type Key = "x_mm" | "y_mm" | "sp_x_mm" | "sp_y_mm";

// Ball (white) and setpoint (orange) against time.
export default function LineChart({ samples, yKey, spKey }: { samples: Sample[]; yKey: Key; spKey: Key }) {
  if (samples.length < 2) return <p className="py-8 text-center text-muted">No data yet.</p>;

  const t0 = samples[0].t_ms;
  const t1 = samples[samples.length - 1].t_ms;
  const values = samples.flatMap((s) => [s[yKey], s[spKey]]);
  let min = Math.min(...values);
  let max = Math.max(...values);
  // At least 20 mm tall, so camera noise does not fill the chart.
  if (max - min < 20) {
    const mid = (max + min) / 2;
    min = mid - 10;
    max = mid + 10;
  }

  function points(key: Key) {
    return samples
      .map((s) => `${(((s.t_ms - t0) / (t1 - t0)) * W).toFixed(1)},${(H * (1 - (s[key] - min) / (max - min))).toFixed(1)}`)
      .join(" ");
  }

  const seconds = ((t1 - t0) / 1000).toFixed(1);

  return (
    <div>
      <p className="flex justify-between font-mono text-xs text-muted">
        <span>{max.toFixed(1)} mm</span>
        <span>{seconds} s</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full bg-panel">
        <title>{`Ball position (white) and setpoint (orange) over ${seconds} seconds`}</title>
        <polyline points={points(spKey)} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={points(yKey)} fill="none" stroke="var(--ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="font-mono text-xs text-muted">{min.toFixed(1)} mm</p>
    </div>
  );
}
