"use client";

import { useEffect, useState } from "react";
import { API, STALE_MS, parseCsv } from "./config";
import type { Sample } from "./config";

const POLL_MS = 500;
const KEEP = 500; // about 20 to 30 s at 15 to 23 samples per second

export default function useLiveData() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let alive = true;
    let busy = false; // skip a poll if the last one is still running
    let run = "";
    let lastBody = "";
    let lastChange = Date.now();

    async function poll() {
      if (busy) return;
      busy = true;
      try {
        const res = await fetch(`${API}/runs`, { cache: "no-store" });
        const names: string[] = await res.json();
        const newest = names[names.length - 1];
        if (!newest) throw new Error("no runs");

        if (newest !== run) {
          run = newest;
          lastBody = "";
          lastChange = Date.now();
          if (alive) setSamples([]);
        }

        const csv = await fetch(`${API}/runs/${newest}`, { cache: "no-store" });
        if (!csv.ok) throw new Error("cannot read csv");
        const body = await csv.text();
        if (!alive) return;

        // A changed file means the logger wrote a new line.
        if (body !== lastBody) {
          lastBody = body;
          lastChange = Date.now();
          setSamples(parseCsv(body).slice(-KEEP));
          setConnected(true);
        } else if (Date.now() - lastChange > STALE_MS) {
          setConnected(false);
        }
      } catch {
        if (alive) setConnected(false);
      } finally {
        busy = false;
      }
    }

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return { samples, connected };
}
