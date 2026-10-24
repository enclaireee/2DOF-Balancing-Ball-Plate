import type { StepResult } from "../stepResponse";

function fmt(n: number | null) {
  return n === null ? "--" : n.toFixed(2);
}

export default function StepTable({ rows }: { rows: StepResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-sm">
        <thead>
          <tr className="border-b border-muted">
            {["Step mm", "Rise s", "Overshoot %", "Settling s", "SS error mm"].map((h) => (
              <th key={h} className="px-2 py-2 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line">
              <td className="px-2 py-2 whitespace-nowrap">
                {r.from} → {r.to}
              </td>
              <td className="px-2 py-2">{fmt(r.riseS)}</td>
              <td className="px-2 py-2">{fmt(r.overshootPct)}</td>
              <td className="px-2 py-2">{fmt(r.settlingS)}</td>
              <td className="px-2 py-2">{fmt(r.sseMm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
