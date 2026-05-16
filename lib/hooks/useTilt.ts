"use client";

import { useEffect, useState } from "react";

type UseTiltOptions = {
  disabled?: boolean;
  maxDeviceTilt?: number;
};

type TiltVector = {
  x: number;
  y: number;
  active: boolean;
};

const ZERO_TILT: TiltVector = { x: 0, y: 0, active: false };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTilt({
  disabled = false,
  maxDeviceTilt = 18
}: UseTiltOptions = {}): TiltVector {
  const [tilt, setTilt] = useState<TiltVector>(ZERO_TILT);

  useEffect(() => {
    if (disabled || prefersReducedMotion()) {
      setTilt(ZERO_TILT);
      return;
    }

    function updateFromPointer(event: PointerEvent) {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;

      setTilt({
        x: clamp(x, -1, 1),
        y: clamp(y, -1, 1),
        active: true
      });
    }

    function updateFromDevice(event: DeviceOrientationEvent) {
      if (typeof event.gamma !== "number" || typeof event.beta !== "number") {
        return;
      }

      setTilt({
        x: clamp(event.gamma / maxDeviceTilt, -1, 1),
        y: clamp(event.beta / maxDeviceTilt, -1, 1),
        active: true
      });
    }

    window.addEventListener("pointermove", updateFromPointer, { passive: true });
    window.addEventListener("deviceorientation", updateFromDevice, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updateFromPointer);
      window.removeEventListener("deviceorientation", updateFromDevice);
    };
  }, [disabled, maxDeviceTilt]);

  return tilt;
}
