/**
 * useOnlineStatus
 *
 * A lightweight, dependency-free hook that periodically checks network
 * connectivity by fetching a reliable endpoint (Cloudflare DNS).
 *
 * Why this approach instead of NetInfo?
 *  - Avoids adding a new native dependency for a simple connectivity check.
 *  - Using `fetch` with a short timeout is more direct: it tests actual
 *    HTTP reachability, not just link-layer status.
 *
 * The hook polls every 30 seconds by default. The interval resets on app
 * foreground (AppState listener) to detect coming back online quickly.
 *
 * Usage:
 * ```tsx
 * const { isOnline, isChecking } = useOnlineStatus();
 * // Render an offline banner when !isOnline
 * ```
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";

/** Endpoint used for reachability checks. */
const CHECK_URL = "https://1.1.1.1";
/** Timeout per individual fetch attempt (ms). */
const FETCH_TIMEOUT_MS = 5_000;
/** Interval between periodic checks (ms). */
const POLL_INTERVAL_MS = 30_000;

export interface OnlineStatusResult {
  /** true if the device appears to have internet connectivity. */
  isOnline: boolean;
  /** true while a connectivity check is in flight. */
  isChecking: boolean;
  /** Manually trigger an immediate connectivity check. */
  checkNow: () => void;
}

/**
 * Perform a single reachability fetch.
 * Returns true if the fetch succeeds within the timeout, false otherwise.
 */
async function ping(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    await fetch(CHECK_URL, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hook that provides real-time online/offline status.
 *
 * @param options.pollInterval  Override the default polling interval (ms).
 */
export function useOnlineStatus(options?: {
  pollInterval?: number;
}): OnlineStatusResult {
  const pollInterval = options?.pollInterval ?? POLL_INTERVAL_MS;

  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const checkNow = useCallback(async () => {
    setIsChecking(true);
    const result = await ping();
    setIsOnline(result);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    // Perform an initial check immediately.
    checkNow();

    // Start periodic polling.
    intervalRef.current = setInterval(checkNow, pollInterval);

    // Listen for app foreground events to check immediately.
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          checkNow();
        }
        appStateRef.current = nextState;
      },
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [checkNow, pollInterval]);

  return { isOnline, isChecking, checkNow };
}
