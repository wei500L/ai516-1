"use client";

import { useEffect, useState, type RefObject } from "react";

type UseTiltOptions = {
  disabled?: boolean;
  maxDeviceTilt?: number;
  targetRef?: RefObject<HTMLElement | null>;
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
  maxDeviceTilt = 18,
  targetRef
}: UseTiltOptions = {}): TiltVector {
  const [tilt, setTilt] = useState<TiltVector>(ZERO_TILT);

  useEffect(() => {
    if (disabled || prefersReducedMotion()) {
      setTilt(ZERO_TILT);
      return;
    }

    const target = targetRef?.current ?? null;

    function updateFromPointer(event: PointerEvent) {
      const rect = target?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const w = rect ? rect.width / 2 : window.innerWidth / 2;
      const h = rect ? rect.height / 2 : window.innerHeight / 2;

      setTilt({
        x: clamp((event.clientX - cx) / w, -1, 1),
        y: clamp((event.clientY - cy) / h, -1, 1),
        active: true
      });
    }

    function resetTilt() {
      setTilt(ZERO_TILT);
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

    const pointerHost: HTMLElement | Window = target ?? window;
    pointerHost.addEventListener("pointermove", updateFromPointer as EventListener, {
      passive: true
    });
    if (target) {
      target.addEventListener("pointerleave", resetTilt, { passive: true });
    }
    window.addEventListener("deviceorientation", updateFromDevice, { passive: true });

    return () => {
      pointerHost.removeEventListener("pointermove", updateFromPointer as EventListener);
      if (target) {
        target.removeEventListener("pointerleave", resetTilt);
      }
      window.removeEventListener("deviceorientation", updateFromDevice);
    };
  }, [disabled, maxDeviceTilt, targetRef]);

  return tilt;
}
