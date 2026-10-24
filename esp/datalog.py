import argparse
import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import serial
from serial.tools import list_ports

sys.path.insert(0, str(Path(__file__).parent.parent / "vision"))
import vision

HEADER = "t_ms,x_mm,y_mm,sp_x_mm,sp_y_mm,u_x_deg,u_y_deg"
BAUD = 115200
WEB_PORT = 8000
RUNS_FOLDER = Path(__file__).parent.parent / "data_logging" / "runs"


def findPort():
    # on Windows every port is called COMx, but only USB ones have a vendor id
    for info in list_ports.comports():
        if info.vid is not None:
            return info.device
    return None


def readLine(esp):
    raw = esp.readline().replace(b"\x00", b"")
    return raw.decode("utf-8", errors="ignore").strip()


def isDataLine(line):
    parts = line.split(",")
    if len(parts) != 7:
        return False
    try:
        for part in parts:
            float(part)
    except ValueError:
        return False
    return True


def readReply(esp):
    # skip messages like "# timeout" so we never fall one line behind
    while True:
        line = readLine(esp)
        if isDataLine(line) or line == "# no ball" or line == "":
            return line
        print(line)


def listRuns():
    return sorted(file.name for file in RUNS_FOLDER.glob("*.csv"))


class Website(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/runs":
            self.sendText(json.dumps(listRuns()), "application/json")
        elif self.path.startswith("/runs/"):
            name = self.path[len("/runs/"):]
            # only files from the list, so nobody can ask for /runs/../something
            if name in listRuns():
                self.sendText((RUNS_FOLDER / name).read_text(), "text/csv")
            else:
                self.send_error(404)
        else:
            self.send_error(404)

    def sendText(self, text, contentType):
        self.send_response(200)
        self.send_header("Content-Type", contentType)
        # the dashboard runs on port 3000, so the browser needs this to read port 8000
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(text.encode())

    def log_message(self, format, *args):
        pass


def startWebsite():
    server = ThreadingHTTPServer(("127.0.0.1", WEB_PORT), Website)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"Website data at http://127.0.0.1:{WEB_PORT}/runs")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("name", nargs="?", help="file name, e.g. run1 (default: date and time)")
    parser.add_argument("--port", help="COM port of the ESP32, e.g. COM3")
    args = parser.parse_args()

    name = args.name or time.strftime("run_%Y%m%d_%H%M%S")
    if not name.endswith(".csv"):
        name += ".csv"
    RUNS_FOLDER.mkdir(parents=True, exist_ok=True)
    filename = RUNS_FOLDER / name

    vision.loadSettings()
    camera = vision.openCamera()
    if not camera.isOpened():
        sys.exit("Cannot open the camera. Check CAMERA in vision/vision.py.")

    port = args.port or findPort()
    if port is None:
        sys.exit("No ESP32 found. Plug it in or pass --port COM3.")
    esp = serial.Serial(port, BAUD, timeout=2)
    print("ESP32 on", port)
    # opening the port restarts the ESP32, give it time to boot
    time.sleep(1.5)

    startWebsite()
    csvFile = open(filename, "w")
    csvFile.write(HEADER + "\n")
    print("Saving to", filename, "- press Ctrl+C to stop")

    esp.reset_input_buffer()

    try:
        while True:
            ok, frame = camera.read()
            ball = vision.findBallMm(frame) if ok else None

            if ball is None:
                esp.write(b"pos none\n")
            else:
                esp.write(f"pos {ball[0]:.1f} {ball[1]:.1f}\n".encode())

            line = readReply(esp)
            if isDataLine(line):
                csvFile.write(line + "\n")
                csvFile.flush()
    except KeyboardInterrupt:
        print("Stopped. Data saved in", filename)
    finally:
        csvFile.close()
        camera.release()


if __name__ == "__main__":
    main()
