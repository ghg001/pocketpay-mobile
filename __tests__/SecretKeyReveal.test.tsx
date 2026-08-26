/**
 * SecretKeyReveal – clipboard error handling tests
 *
 * Covers issue #218 acceptance criteria:
 *  - Storage/clipboard failures are handled gracefully (no crash / unhandled rejection).
 *  - User messages are clear.
 *  - Secrets are not exposed in errors or logs.
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('lucide-react-native', () => ({
  Eye: () => null,
  EyeOff: () => null,
  Copy: () => null,
  // Rendered by the shared ConfirmModal that now backs the reveal warning.
  X: () => null,
  AlertTriangle: () => null,
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#fff',
      textSecondary: '#ccc',
      textMuted: '#999',
      error: '#f00',
      primary: '#0ff',
      background: '#000',
      surface: '#111',
      surfaceLight: '#222',
      border: '#333',
    },
  }),
}));

import * as Clipboard from 'expo-clipboard';
import { SecretKeyReveal } from '../src/components/SecretKeyReveal';

const mockedClipboard = Clipboard as jest.Mocked<typeof Clipboard>;
const SECRET = 'SVERYSECRETKEYVALUE1234567890ABCDEFGHIJKLMNOPQRSTUV';

/**
 * Reveals the key by confirming the shared ConfirmModal warning, which replaced
 * the native destructive Alert.
 */
const revealKey = async (getAllByLabelText: (label: string) => unknown[]) => {
  await act(async () => {
    // The trigger button and the modal's confirm action share the "Reveal"
    // label; the modal's is the one rendered last.
    const revealButtons = getAllByLabelText('Reveal') as Parameters<typeof fireEvent.press>[0][];
    fireEvent.press(revealButtons[revealButtons.length - 1]);
  });
};

describe('SecretKeyReveal clipboard error handling', () => {
  let alertSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('shows a clear, non-technical message and logs no secret when clipboard write fails', async () => {
    mockedClipboard.setStringAsync.mockRejectedValueOnce(new Error('Clipboard access denied'));

    const { getByLabelText, getAllByLabelText } = render(<SecretKeyReveal secretKey={SECRET} />);

    fireEvent.press(getByLabelText('Reveal secret key'));
    await revealKey(getAllByLabelText);

    await act(async () => {
      fireEvent.press(getByLabelText('Copy secret key'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Copy Failed',
      expect.stringContaining('Could not copy to clipboard')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Clipboard copy failed:', expect.any(Error));
    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(SECRET);
    expect(JSON.stringify(alertSpy.mock.calls)).not.toContain(SECRET);
  });

  it('confirms successful copy with a clear message', async () => {
    mockedClipboard.setStringAsync.mockResolvedValueOnce(undefined);

    const { getByLabelText, getAllByLabelText } = render(<SecretKeyReveal secretKey={SECRET} />);

    fireEvent.press(getByLabelText('Reveal secret key'));
    await revealKey(getAllByLabelText);

    await act(async () => {
      fireEvent.press(getByLabelText('Copy secret key'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(alertSpy).toHaveBeenCalledWith('Copied', expect.stringContaining('copied to clipboard'));
  });
});
