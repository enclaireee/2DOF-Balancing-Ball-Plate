int tiltToPulse(float tilt, int center, int direction, int pulseMin, int pulseMax) {
  float pulse = center + direction * PULSE_PER_DEG * tilt;
  return round(constrain(pulse, pulseMin, pulseMax));
}

void moveServos(float tiltX, float tiltY) {
  servoX.writeMicroseconds(tiltToPulse(tiltX, PULSE_CENTER_X, SERVO_DIR_X, PULSE_MIN_X, PULSE_MAX_X));
  servoY.writeMicroseconds(tiltToPulse(tiltY, PULSE_CENTER_Y, SERVO_DIR_Y, PULSE_MIN_Y, PULSE_MAX_Y));
}

// the tilt range that keeps each pulse inside its limits
void setTiltLimits() {
  float ax = (PULSE_MIN_X - PULSE_CENTER_X) / (SERVO_DIR_X * PULSE_PER_DEG);
  float bx = (PULSE_MAX_X - PULSE_CENTER_X) / (SERVO_DIR_X * PULSE_PER_DEG);
  axisX.tiltMin = min(ax, bx);
  axisX.tiltMax = max(ax, bx);

  float ay = (PULSE_MIN_Y - PULSE_CENTER_Y) / (SERVO_DIR_Y * PULSE_PER_DEG);
  float by = (PULSE_MAX_Y - PULSE_CENTER_Y) / (SERVO_DIR_Y * PULSE_PER_DEG);
  axisY.tiltMin = min(ay, by);
  axisY.tiltMax = max(ay, by);
}
