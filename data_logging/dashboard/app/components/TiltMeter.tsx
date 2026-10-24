import { TILT_DISPLAY_MAX_DEG, fmt } from "../config";
import type { Sample } from "../config";

export default function TiltMeter({ samples }: { samples: Sample[] }) {
  const last = samples.length > 0 ? samples[samples.length - 1] : undefined;
  const axes = [
    { name: "X", deg: last?.u_x_deg },
    { name: "Y", deg: last?.u_y_deg },
  ];

  return (
    <div className="flex flex-col gap-3">
      {axes.map(({ name, deg }) => {
        // The bar grows from the middle; half the track is one limit.
        const share = Math.min(Math.abs(deg ?? 0) / TILT_DISPLAY_MAX_DEG, 1) * 50;
        return (
          <div key={name}>
            <p className="flex justify-between font-mono text-sm">
              <span>{name}</span>
              <span>{fmt(deg)}°</span>
            </p>
            <div role="img" aria-label={`${name} tilt ${fmt(deg)} degrees`} className="relative h-2 bg-line">
              <span
                className="absolute top-0 h-full bg-ink"
                style={{ left: `${(deg ?? 0) >= 0 ? 50 : 50 - share}%`, width: `${share}%` }}
              />
              <span className="absolute top-0 left-1/2 h-full w-px bg-muted" />
            </div>
          </div>
        );
      })}
      <p className="flex justify-between font-mono text-xs text-muted">
        <span>-{TILT_DISPLAY_MAX_DEG}°</span>
        <span>0°</span>
        <span>+{TILT_DISPLAY_MAX_DEG}°</span>
      </p>
    </div>
  );
}
