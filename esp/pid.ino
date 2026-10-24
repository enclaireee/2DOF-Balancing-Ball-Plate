// returns the plate tilt in degrees for one axis
float axisStep(Axis &a, float setpoint, float pos, float dt) {
  float error = setpoint - pos;

  if (fabs(error) <= SETTLE_TOL_MM) {
    a.prevPos = pos;
    a.integral = 0.0f;
    return 0.0f;
  }

  // dt is 0 right after hold() and big after a gap, so only trust a normal frame
  bool fresh = dt > 0.0f && dt <= 0.2f;

  float speed = 0.0f;
  float newIntegral = a.integral;
  if (fresh) {
    speed = (pos - a.prevPos) / dt;
    newIntegral = a.integral + error * dt;
  }
  a.prevPos = pos;

  // D uses the ball speed, not the error change, so a setpoint change does not kick the plate
  float u = KP * error + KI * newIntegral - KD * speed;

  // anti-windup: only keep the integral while the output is not at a limit
  if (u >= a.tiltMin && u <= a.tiltMax) {
    a.integral = newIntegral;
  }

  return constrain(u, a.tiltMin, a.tiltMax);
}
