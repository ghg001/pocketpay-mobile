import {
  reportError,
  getLastErrorReport,
  clearLastErrorReport,
} from '../errorReporting';
import { REDACTED_SECRET } from '../redactSensitive';

describe('reportError', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
    clearLastErrorReport();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('stores a redacted last-error snapshot for diagnostics', () => {
    const secret = 'S' + 'F'.repeat(55);
    reportError(new Error(`signing failed ${secret}`), {
      source: 'ErrorBoundary',
      isFatal: false,
    });

    const last = getLastErrorReport();
    expect(last).not.toBeNull();
    expect(last!.source).toBe('ErrorBoundary');
    expect(last!.message).toBe(`signing failed ${REDACTED_SECRET}`);
    expect(last!.message).not.toContain(secret);
    expect(last!.timestamp).toBeTruthy();
  });

  it('logs sanitized payloads rather than raw secrets', () => {
    const secret = 'S' + 'G'.repeat(55);
    reportError(new Error(secret), { source: 'GlobalJsHandler', isFatal: true });

    expect(console.error).toHaveBeenCalled();
    const [, sanitized] = (console.error as jest.Mock).mock.calls[0];
    expect(sanitized.message).toBe(REDACTED_SECRET);
  });
});
