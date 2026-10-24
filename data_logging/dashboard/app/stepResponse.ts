import type { Axis, Sample } from "./config";

export type Step = { start: number; end: number; from: number; to: number };

export type StepResult = {
  from: number;
  to: number;
  riseS: number | null;
  overshootPct: number | null;
  settlingS: number | null;
  sseMm: number | null;
};

function pos(s: Sample, axis: Axis) {
  return axis === "x" ? s.x_mm : s.y_mm;
}

function target(s: Sample, axis: Axis) {
  return axis === "x" ? s.sp_x_mm : s.sp_y_mm;
}

// A step starts where the setpoint changes and lasts until the next change.
export function findSteps(samples: Sample[], axis: Axis): Step[] {
  const starts: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    if (Math.abs(target(samples[i], axis) - target(samples[i - 1], axis)) > 1e-9) starts.push(i);
  }
  return starts.map((start, k) => ({
    start,
    end: k + 1 < starts.length ? starts[k + 1] : samples.length,
    from: target(samples[start - 1], axis),
    to: target(samples[start], axis),
  }));
}

export function stepMetrics(samples: Sample[], step: Step, axis: Axis): StepResult {
  const jump = step.to - step.from;
  const win = samples.slice(step.start, step.end);
  // 0 = still at the old setpoint, 1 = at the new one
  const progress = win.map((s) => (pos(s, axis) - step.from) / jump);

  // Rise time: from 10% to 90% of the jump.
  const i10 = progress.findIndex((p) => p >= 0.1);
  const i90 = progress.findIndex((p) => p >= 0.9);
  const riseS = i10 >= 0 && i90 >= 0 ? (win[i90].t_ms - win[i10].t_ms) / 1000 : null;

  const overshootPct = Math.max(0, (Math.max(...progress) - 1) * 100);

  // Settling time: after the last sample outside +-5%, the ball stays inside.
  let lastOut = -1;
  progress.forEach((p, i) => {
    if (Math.abs(p - 1) > 0.05) lastOut = i;
  });
  const settlingS = lastOut === win.length - 1 ? null : (win[lastOut + 1].t_ms - win[0].t_ms) / 1000;

  // Steady-state error: target minus the mean position over the last second.
  const tEnd = win[win.length - 1].t_ms;
  const tail = win.filter((s) => s.t_ms > tEnd - 1000);
  const mean = tail.reduce((sum, s) => sum + pos(s, axis), 0) / tail.length;

  return { from: step.from, to: step.to, riseS, overshootPct, settlingS, sseMm: step.to - mean };
}
