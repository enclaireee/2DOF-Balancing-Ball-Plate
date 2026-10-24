"use client";

import { useEffect, useState } from "react";
import { API, parseCsv } from "../config";
import type { Axis, Sample } from "../config";
import { findSteps, stepMetrics } from "../stepResponse";
import LineChart from "../components/LineChart";
import StepTable from "../components/StepTable";

const button = "min-h-11 border border-muted px-4 hover:border-accent";

export default function RunsPage() {
  const [runs, setRuns] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [axis, setAxis] = useState<Axis>("x");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    fetch(`${API}/runs`)
      .then((res) => res.json())
      .then((names: string[]) => {
        setRuns(names);
        setError(false);
        setSelected((old) => (names.includes(old) ? old : (names[0] ?? "")));
      })
      .catch(() => setError(true));
  }, [reload]);

  useEffect(() => {
    if (selected === "") return;
    fetch(`${API}/runs/${selected}`)
      .then((res) => res.text())
      .then((text) => setSamples(parseCsv(text)))
      .catch(() => setError(true));
  }, [selected, reload]);

  const rows = findSteps(samples, axis).map((step) => stepMetrics(samples, step, axis));
  const a = axis.toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Runs</h1>
      {error && (
        <p role="alert" className="text-red-400">
          Cannot reach datalog.py. Start it, then press Refresh.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Saved runs ({runs.length})</h2>
            <button className={button} onClick={() => setReload(reload + 1)}>
              Refresh
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {runs.map((name) => (
              <li key={name}>
                <button
                  onClick={() => setSelected(name)}
                  aria-current={name === selected ? "true" : undefined}
                  className={`min-h-11 w-full truncate border-b border-line px-2 text-left font-mono text-sm ${
                    name === selected ? "text-accent" : "hover:bg-panel"
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
          {runs.length === 0 && !error && <p className="text-muted">No runs yet. Start datalog.py for a few seconds.</p>}
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            {(["x", "y"] as Axis[]).map((ax) => (
              <button
                key={ax}
                aria-pressed={axis === ax}
                onClick={() => setAxis(ax)}
                className={`${button} ${axis === ax ? "border-accent text-accent" : ""}`}
              >
                {ax.toUpperCase()}
              </button>
            ))}
            {selected !== "" && (
              <a href={`${API}/runs/${selected}`} download className={`${button} inline-flex items-center`}>
                Download CSV
              </a>
            )}
          </div>

          <section>
            <h2 className="mb-2 font-semibold">{a} position, whole run</h2>
            <LineChart samples={samples} yKey={axis === "x" ? "x_mm" : "y_mm"} spKey={axis === "x" ? "sp_x_mm" : "sp_y_mm"} />
          </section>
          <section>
            <h2 className="mb-2 font-semibold">Step response, {a}</h2>
            {rows.length === 0 ? (
              <p className="text-muted">This run has no setpoint change on {a}.</p>
            ) : (
              <StepTable rows={rows} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
