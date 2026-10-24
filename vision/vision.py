import json
import time
from pathlib import Path

import cv2

CAMERA = 1
THRESHOLD = 200
MIN_AREA = 30

SETTINGS_FILE = Path(__file__).with_name("settings.json")

# plate box in pixels, overwritten by settings.json
PLATE_LEFT = 120
PLATE_RIGHT = 520
PLATE_TOP = 40
PLATE_BOTTOM = 440

PLATE_W_MM = 250
PLATE_H_MM = 250


def makeMask(frame, threshold):
    plate = frame[PLATE_TOP:PLATE_BOTTOM, PLATE_LEFT:PLATE_RIGHT]
    gray = cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    return mask


def findBall(mask):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if len(contours) == 0:
        return None

    ball = max(contours, key=cv2.contourArea)
    if cv2.contourArea(ball) < MIN_AREA:
        return None

    # the mask is cut to the plate, so add the box corner back
    m = cv2.moments(ball)
    x_px = m["m10"] / m["m00"] + PLATE_LEFT
    y_px = m["m01"] / m["m00"] + PLATE_TOP
    return x_px, y_px


def toMm(x_px, y_px):
    # (0, 0) is the plate centre, x to the right, y up (picture y goes down)
    center_x = (PLATE_LEFT + PLATE_RIGHT) / 2
    center_y = (PLATE_TOP + PLATE_BOTTOM) / 2
    x_mm = (x_px - center_x) * PLATE_W_MM / (PLATE_RIGHT - PLATE_LEFT)
    y_mm = (center_y - y_px) * PLATE_H_MM / (PLATE_BOTTOM - PLATE_TOP)
    return x_mm, y_mm


def findBallMm(frame):
    ball = findBall(makeMask(frame, THRESHOLD))
    if ball is None:
        return None
    return toMm(ball[0], ball[1])


def loadSettings():
    global PLATE_LEFT, PLATE_RIGHT, PLATE_TOP, PLATE_BOTTOM, THRESHOLD
    if SETTINGS_FILE.exists():
        saved = json.loads(SETTINGS_FILE.read_text())
        PLATE_LEFT, PLATE_RIGHT = saved["left"], saved["right"]
        PLATE_TOP, PLATE_BOTTOM = saved["top"], saved["bottom"]
        THRESHOLD = saved["threshold"]


def saveSettings(threshold):
    saved = {
        "left": PLATE_LEFT,
        "right": PLATE_RIGHT,
        "top": PLATE_TOP,
        "bottom": PLATE_BOTTOM,
        "threshold": threshold,
    }
    SETTINGS_FILE.write_text(json.dumps(saved, indent=2))
    print("saved", SETTINGS_FILE)


def openCamera():
    # DirectShow keeps at most one old frame waiting, the Windows default keeps more and lags
    camera = cv2.VideoCapture(CAMERA, cv2.CAP_DSHOW)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return camera


def selectPlate(frame):
    global PLATE_LEFT, PLATE_RIGHT, PLATE_TOP, PLATE_BOTTOM
    x, y, w, h = [int(v) for v in cv2.selectROI("camera", frame, showCrosshair=False)]
    if w == 0 or h == 0:
        return
    PLATE_LEFT, PLATE_TOP = x, y
    PLATE_RIGHT, PLATE_BOTTOM = x + w, y + h


def main():
    loadSettings()
    camera = openCamera()

    cv2.namedWindow("camera")
    cv2.namedWindow("mask")
    cv2.createTrackbar("threshold", "mask", THRESHOLD, 255, lambda value: None)

    lastTime = time.time()
    while True:
        ok, frame = camera.read()
        if not ok:
            print("Cannot read the camera. Check CAMERA and the Windows camera permission.")
            break

        threshold = cv2.getTrackbarPos("threshold", "mask")
        mask = makeMask(frame, threshold)
        ball = findBall(mask)

        now = time.time()
        fps = 1 / (now - lastTime)
        lastTime = now

        cv2.rectangle(frame, (PLATE_LEFT, PLATE_TOP), (PLATE_RIGHT, PLATE_BOTTOM), (255, 0, 0), 2)
        if ball is None:
            text = "no ball"
        else:
            x_mm, y_mm = toMm(ball[0], ball[1])
            text = f"x={x_mm:6.1f} mm  y={y_mm:6.1f} mm"
            cv2.circle(frame, (int(ball[0]), int(ball[1])), 15, (0, 255, 0), 2)

        print(text)
        cv2.putText(frame, f"{text}  {fps:4.1f} fps", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.putText(frame, "p = set plate box   q = save and quit", (10, 470), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        cv2.imshow("camera", frame)
        cv2.imshow("mask", mask)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("p"):
            # take a new frame so the box is drawn on a clean picture
            ok, clean = camera.read()
            if ok:
                selectPlate(clean)
                saveSettings(threshold)
        if key == ord("q"):
            saveSettings(threshold)
            break

    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
