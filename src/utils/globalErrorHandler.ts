import { reportError } from './errorReporting';

/**
 * React error boundaries only catch errors thrown during render, in
 * lifecycle methods, and in constructors of the component tree below them.
 * They do NOT catch errors in event handlers, timers/async callbacks, or
 * unhandled promise rejections — which is most of what actually crashes a
 * mobile app in practice. This installs the two handlers that cover that
 * remaining surface. Call `installGlobalErrorHandlers()` once, as early as
 * possible in app startup (before rendering the root component).
 */
export function installGlobalErrorHandlers(): void {
  installJsExceptionHandler();
  installUnhandledRejectionTracking();
}

function installJsExceptionHandler(): void {
  const g = global as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
      setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
    };
  };

  if (!g.ErrorUtils) return; // e.g. running under plain Node/Jest

  const previousHandler = g.ErrorUtils.getGlobalHandler();

  g.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    reportError(error, { source: 'GlobalJsHandler', isFatal: Boolean(isFatal) });

    // Preserve default RedBox/crash behavior (dev RedBox, prod restart) —
    // we only want to observe here, never swallow.
    previousHandler(error, isFatal);
  });
}

function installUnhandledRejectionTracking(): void {
  try {
    // Ships with React Native's promise polyfill; not a separate install.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    rejectionTracking.enable({
      allRejections: true,
      onUnhandled: (id: number, error: Error) => {
        reportError(error, { source: 'UnhandledPromiseRejection', rejectionId: id });
      },
      onHandled: () => {
        // No-op: a rejection that was eventually handled isn't worth reporting.
      },
    });
  } catch {
    // If the polyfill path ever changes upstream, fail open rather than
    // crashing app startup over telemetry wiring.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[globalErrorHandler] promise rejection tracking unavailable');
    }
  }
}
