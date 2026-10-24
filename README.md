# Ball and Plate

Control Lab Task 4. An ESP32 keeps a ball at the centre of a tilting plate. A camera is the sensor and there is one PID per axis. How it fits together: [architecture.md](architecture.md).

```
camera -> laptop: find the ball in mm -> ESP32: PID per axis -> 2 servos -> plate -> ball moves
```

The laptop measures and logs, the ESP32 does the control, and the dashboard shows both.

## Setup (once)

You need Python 3 from python.org (it includes the `py` launcher) and Node.js 20.9 or newer. Open PowerShell or cmd in the project folder:

```bash
py -m venv .venv
.venv\Scripts\pip install -r requirements.txt
cd data_logging\dashboard
npm install
cd ..\..
```

From now on, run Python with `.venv\Scripts\python`.

## 1. Vision: find the ball

```bash
.venv\Scripts\python vision\vision.py
```

- `p`: drag a box over the plate, then press Enter. It is saved straight away.
- threshold slider (in the `mask` window): move it until only the ball is white.
- `q`: save the box and the threshold to `vision/settings.json` and quit.

`datalog.py` reads the settings once at startup, so stop it before changing them. If you move or swap the webcam, redo the box and the threshold.

If the camera does not open, go to Windows Settings → Privacy & security → Camera and turn on "Camera access" and "Let desktop apps access your camera".

## 2. Run a log

```bash
.venv\Scripts\python esp\datalog.py run1
```

It opens the camera and sends `pos x y` (or `pos none`) to the ESP32 every frame. The line the ESP32 sends back is saved to `data_logging/runs/run1.csv`, and the files are served to the dashboard at `http://127.0.0.1:8000`. With no name, the file is named from the date and time. `Ctrl+C` stops it.

The ESP32 port is found automatically. If the wrong one is picked, add `--port COM3`; the number is in Device Manager → Ports (COM & LPT). If no COM port shows up, install the USB driver for the board's chip (CP210x or CH340).

## 3. Dashboard

Keep `datalog.py` running. In a second terminal:

```bash
cd data_logging\dashboard
npm run dev
```

Then open `http://localhost:3000`. The Live page reads the newest CSV every 0.5 s, and the Runs page opens any saved run.

## 4. Flash the ESP32

In the Arduino IDE:

1. Board: **ESP32 Dev Module** (install the `esp32` board package if it is missing).
2. Library: **ESP32Servo** (Library Manager).
3. Open `esp/esp.ino`. `pid.ino` and `plate.ino` open as tabs next to it.
4. Pick the port under Tools → Port and press Upload.

Wiring: the servo X signal goes to GPIO 2 and the servo Y signal to GPIO 4. The servos get their own 5 V supply, with the grounds joined to the ESP32.

All the settings are constants at the top of `esp/esp.ino`:

| Setting | Now | How to check |
|---|---|---|
| `SERVO_X_PIN`, `SERVO_Y_PIN` | 2, 4 | match the wiring |
| `PULSE_CENTER_X/Y` | 1400 µs | adjust until the axis is level (phone level app) |
| `PULSE_MIN_X/Y`, `PULSE_MAX_X/Y` | 1150/1300, 1800/1850 µs | just short of where the plate hits the frame |
| `SERVO_DIR_X/Y` | +1 | a positive tilt must roll the ball toward +x / +y |
| `PULSE_PER_DEG` | 50 µs/° | send centre + 100 µs, measure the tilt, `100 / tilt` |
| `KP`, `KI`, `KD` | 0.055, 0.04, 0.05 | tune on the rig, then reflash |
| `CAMERA` in `vision/vision.py` | 1 | 0 = built-in webcam, 1 = USB webcam |
| `PLATE_W_MM`, `PLATE_H_MM` in `vision/vision.py` | 250 | measure the plate with a ruler |

`PULSE_PER_DEG` and the 250 × 250 mm plate size are not measured yet.

## If something doesn't work

- "Only one usage of each socket address": an old `datalog.py` still holds port 8000. Run `netstat -ano | findstr :8000`, then `taskkill /PID <pid> /F`.
- "No ESP32 found" or "Access is denied" on the COM port: close the Arduino Serial Monitor or the other `datalog.py`, then try again or pass `--port COM3`.
- "running scripts is disabled" (PowerShell blocks npm): run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use cmd.

## Files

```
vision/vision.py         camera picture -> ball x, y in mm
vision/settings.json     plate box and threshold
esp/esp.ino              ESP32: settings, setup, loop, pos command
esp/pid.ino              PID for one axis
esp/plate.ino            tilt -> servo pulse
esp/datalog.py           laptop: camera -> ESP32, save CSV, serve the dashboard
data_logging/runs/       one CSV per run
data_logging/dashboard/  Next.js dashboard (Live, Runs, Setup)
analysis/                analysis reports
```
