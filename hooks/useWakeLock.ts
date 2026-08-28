"use client";

import { useEffect, useRef, useCallback } from "react";

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");

      wakeLockRef.current.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch (err) {
      // Fails silently if e.g. tab isn't visible, battery saver is on, etc.
      console.warn("Wake lock request failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    requestWakeLock();

    // Wake locks are auto-released when tab becomes hidden (e.g. switching apps).
    // Re-acquire when the user comes back to the tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [enabled, requestWakeLock]);
}
