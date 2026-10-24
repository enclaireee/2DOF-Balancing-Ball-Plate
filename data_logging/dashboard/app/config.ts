export const API = "http://127.0.0.1:8000";

// The plate is 250 mm wide and (0, 0) is its centre.
export const PLATE_HALF_MM = 125;

// The tilt meter is full at this angle.
export const TILT_DISPLAY_MAX_DEG = 6;

// No new data for this long means the logger stopped.
export const STALE_MS = 2000;

export type Sample = {
  t_ms: number;
  x_mm: number;
  y_mm: number;
  sp_x_mm: number;
  sp_y_mm: number;
  u_x_deg: number;
  u_y_deg: number;
};

export type Axis = "x" | "y";

// Keeps only rows of 7 numbers, so the header is skipped.
export function parseCsv(text: string): Sample[] {
  const samples: Sample[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(",");
    if (cells.length !== 7) continue;
    const v = cells.map(Number);
    if (!v.every(Number.isFinite)) continue;
    samples.push({ t_ms: v[0], x_mm: v[1], y_mm: v[2], sp_x_mm: v[3], sp_y_mm: v[4], u_x_deg: v[5], u_y_deg: v[6] });
  }
  return samples;
}

// One decimal, "--" when there is no data. Tiny values show as 0.0, not -0.0.
export function fmt(n: number | undefined) {
  if (n === undefined) return "--";
  return Math.abs(n) < 0.05 ? "0.0" : n.toFixed(1);
}
