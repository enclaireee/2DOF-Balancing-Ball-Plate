import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup · Ball and Plate",
};

const problems = [
  ["Not connected", "The logger is not running, or the ESP32 sends nothing. Start step 2 again."],
  [
    "Only one usage of each socket address",
    "Another program (often an old datalog.py) holds port 8000. Find its PID with netstat -ano | findstr :8000, then stop it with taskkill /PID PID /F.",
  ],
  [
    "No ESP32 found",
    "The board is not plugged in, or another program holds the port. Close the Arduino Serial Monitor, then try again. If it still fails, pass the port: --port COM3. If no COM port appears at all, install the USB driver for the board's chip (Silicon Labs CP210x or WCH CH340).",
  ],
  [
    "Access is denied",
    "Another program holds the COM port: the Arduino Serial Monitor, or an old datalog.py still running in another terminal. Close it, then try again.",
  ],
  [
    "running scripts is disabled",
    "PowerShell blocks npm. Run Set-ExecutionPolicy -Scope CurrentUser RemoteSigned once in PowerShell, or use cmd.",
  ],
  ["No runs in the list", "Nothing saved yet. Let datalog.py run for a few seconds, then press Refresh."],
];

function Commands({ children }: { children: string }) {
  return <pre className="overflow-x-auto bg-panel p-3 font-mono text-sm">{children}</pre>;
}

export default function HowToRunPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Setup</h1>
      <p className="text-muted">
        Everything runs on this laptop. Open every terminal in the project folder. To stop, press Ctrl+C in both terminals.
      </p>

      <ol className="flex list-decimal flex-col gap-6 pl-6">
        <li>
          <h2 className="font-semibold">Set up (only once)</h2>
          <p className="text-muted">
            You need Python 3 from python.org (it includes the py launcher) and Node.js 20.9 or newer. From now on use
            .venv\Scripts\python, so the installed packages are found.
          </p>
          <Commands>{`py -m venv .venv
.venv\\Scripts\\pip install -r requirements.txt
cd data_logging\\dashboard
npm install
cd ..\\..`}</Commands>
        </li>

        <li>
          <h2 className="font-semibold">Start the logger and the dashboard (every time)</h2>
          <p className="text-muted">Two terminals. Keep both open. Terminal 1, the logger:</p>
          <Commands>{`.venv\\Scripts\\python esp\\datalog.py run1`}</Commands>
          <p className="text-muted">
            It saves every sample to data_logging/runs/run1.csv. Leave out the name and it uses the date and time.
            Terminal 2, the dashboard:
          </p>
          <Commands>{`cd data_logging\\dashboard
npm run dev`}</Commands>
          <p className="text-muted">Then open http://localhost:3000. The Live page says Connected when data arrives.</p>
        </li>

        <li>
          <h2 className="font-semibold">Set up the camera (optional)</h2>
          <p className="text-muted">
            Press p and drag a box over the plate, slide the threshold until only the ball is white, then press q to
            save.
          </p>
          <Commands>{`.venv\\Scripts\\python vision\\vision.py`}</Commands>
          <p className="text-muted">
            If no camera window opens: Windows Settings, Privacy &amp; security, Camera, turn on &quot;Camera access&quot; and
            &quot;Let desktop apps access your camera&quot;. After switching or moving the webcam, redo the plate box and
            threshold (p, slider, q).
          </p>
        </li>

        <li>
          <h2 className="font-semibold">Flash the ESP32 (once per board)</h2>
          <p className="text-muted">
            Arduino IDE: board ESP32 Dev Module, install the ESP32Servo library (Library Manager), then open
            esp/esp.ino. The other two files (pid.ino, plate.ino) open as tabs next to it, so keep them in the same
            folder. Press Upload.
          </p>
          <p className="text-muted">
            The logger opens the camera and sends pos x y to the board once per frame. The USB port is found
            automatically; add --port COM3 if it picks the wrong one (the number is in Device Manager, Ports (COM &amp;
            LPT), or Arduino IDE, Tools, Port). The setpoint is the plate centre, (0, 0), set by SP_X and SP_Y in
            esp/esp.ino.
          </p>
        </li>
      </ol>

      <h2 className="mt-4 text-xl font-semibold">If something doesn&apos;t work</h2>
      <dl className="flex flex-col gap-4">
        {problems.map(([problem, fix]) => (
          <div key={problem}>
            <dt className="font-mono text-sm text-accent">{problem}</dt>
            <dd className="text-muted">{fix}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
