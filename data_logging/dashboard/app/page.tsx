"use client";

import LineChart from "./components/LineChart";
import PlateView from "./components/PlateView";
import TiltMeter from "./components/TiltMeter";
import { TILT_DISPLAY_MAX_DEG } from "./config";
import useLiveData from "./useLiveData";

export default function LivePage() {
  const { samples, connected } = useLiveData();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Live</h1>
      {!connected && <p className="text-muted">Not connected. Start esp\datalog.py (see Setup).</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <PlateView samples={samples} connected={connected} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <section>
            <h2 className="mb-2 font-semibold">Tilt (full scale ±{TILT_DISPLAY_MAX_DEG}°)</h2>
            <TiltMeter samples={samples} />
          </section>
          <section>
            <h2 className="mb-2 font-semibold">X position, last 500 samples</h2>
            <LineChart samples={samples} yKey="x_mm" spKey="sp_x_mm" />
          </section>
          <section>
            <h2 className="mb-2 font-semibold">Y position, last 500 samples</h2>
            <LineChart samples={samples} yKey="y_mm" spKey="sp_y_mm" />
          </section>
        </div>
      </div>
    </div>
  );
}
