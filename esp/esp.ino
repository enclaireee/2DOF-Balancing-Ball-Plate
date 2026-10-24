#include <ESP32Servo.h>

const int SERVO_X_PIN = 2;
const int SERVO_Y_PIN = 4;

const int SERVO_US_MIN = 500;
const int SERVO_US_MAX = 2400;

// pulse that makes the plate level
const int PULSE_CENTER_X = 1400;
const int PULSE_CENTER_Y = 1400;

// limits so the plate never hits its stops
const int PULSE_MIN_X = 1150;
const int PULSE_MIN_Y = 1300;
const int PULSE_MAX_X = 1800;
const int PULSE_MAX_Y = 1850;

const float PULSE_PER_DEG = 50.0f;

// flip to -1 if the plate tilts the wrong way
const int SERVO_DIR_X = 1;
const int SERVO_DIR_Y = 1;

const float KP = 0.055f;
const float KI = 0.04f;
const float KD = 0.05f;

const float SP_X = 0.0f;
const float SP_Y = 0.0f;

// inside this distance the ball counts as centred and the plate stays level
const float SETTLE_TOL_MM = 25.0f;

// no message from the laptop for this long -> level the plate
const unsigned long SERIAL_TIMEOUT_MS = 2000;

struct Axis {
  float integral;
  float prevPos;
  float tiltMin;
  float tiltMax;
};

Servo servoX;
Servo servoY;
Axis axisX;
Axis axisY;

unsigned long lastSerialMs = 0;
unsigned long lastControlMs = 0;

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(5);

  setTiltLimits();

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  servoX.setPeriodHertz(50);
  servoY.setPeriodHertz(50);
  servoX.attach(SERVO_X_PIN, SERVO_US_MIN, SERVO_US_MAX);
  servoY.attach(SERVO_Y_PIN, SERVO_US_MIN, SERVO_US_MAX);
  // 16 bit gives finer pulse steps, and it has to be set after attach()
  servoX.setTimerWidth(16);
  servoY.setTimerWidth(16);

  hold();
  lastSerialMs = millis();
  Serial.println("# ball and plate ready");
}

void loop() {
  if (millis() - lastSerialMs > SERIAL_TIMEOUT_MS) {
    hold();
    Serial.println("# timeout: holding flat");
    lastSerialMs = millis();
  }

  if (Serial.available()) {
    handleCommand(Serial.readStringUntil('\n'));
  }
}

void handleCommand(String line) {
  line.trim();
  lastSerialMs = millis();

  if (line == "pos none") {
    hold();
    Serial.println("# no ball");
    return;
  }

  float x, y;
  if (sscanf(line.c_str(), "pos %f %f", &x, &y) == 2) {
    controlStep(x, y);
  }
}

void controlStep(float x, float y) {
  unsigned long now = millis();

  float dt = 0.0f;
  if (lastControlMs != 0) {
    dt = (now - lastControlMs) / 1000.0f;
  }
  lastControlMs = now;

  float ux = axisStep(axisX, SP_X, x, dt);
  float uy = axisStep(axisY, SP_Y, y, dt);
  moveServos(ux, uy);

  Serial.printf("%lu,%.1f,%.1f,%.1f,%.1f,%.2f,%.2f\n", now, x, y, SP_X, SP_Y, ux, uy);
}

// level the plate and clear the PID, so nothing old carries over when the ball comes back
void hold() {
  moveServos(0.0f, 0.0f);
  axisX.integral = 0.0f;
  axisY.integral = 0.0f;
  lastControlMs = 0;
}
