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
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function useTilt({
  disabled = false,
  maxDeviceTilt = 18,
  targetRef
}: UseTiltOptions = {}): TiltVector {
  const [tilt, setTilt] = useState<TiltVector>(ZERO_TILT);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (disabled || reduced) {
      setTilt(ZERO_TILT);
      return;
    }

    const target = targetRef?.current ?? null;
    let rafId: number | null = null;
    let nextTilt: TiltVector | null = null;

    function flush() {
      rafId = null;
      if (nextTilt) {
        setTilt(nextTilt);
        nextTilt = null;
      }
    }

    function schedule(value: TiltVector) {
      nextTilt = value;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    }

    function updateFromPointer(event: PointerEvent) {
      const rect = target?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const w = rect ? rect.width / 2 : window.innerWidth / 2;
      const h = rect ? rect.height / 2 : window.innerHeight / 2;

      schedule({
        x: clamp((event.clientX - cx) / w, -1, 1),
        y: clamp((event.clientY - cy) / h, -1, 1),
        active: true
      });
    }

    function resetTilt() {
      schedule(ZERO_TILT);
    }

    function updateFromDevice(event: DeviceOrientationEvent) {
      if (typeof event.gamma !== "number" || typeof event.beta !== "number") {
        return;
      }

      schedule({
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
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [disabled, reduced, maxDeviceTilt, targetRef]);

  return tilt;
}
