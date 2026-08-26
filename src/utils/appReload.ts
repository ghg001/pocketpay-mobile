import { DevSettings } from 'react-native';

/**
 * Best-effort full JS bundle reload. Available in development builds via
 * DevSettings; production builds may no-op — callers should still reset the
 * error boundary / navigate home as a fallback recovery path.
 */
export function reloadApp(): void {
  try {
    if (typeof DevSettings?.reload === 'function') {
      DevSettings.reload();
    }
  } catch {
    // Never let recovery itself throw.
  }
}
