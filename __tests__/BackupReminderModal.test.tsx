import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BackupReminderModal } from '../src/components/BackupReminderModal';

const mockColors = {
  primary: '#00E5FF',
  primaryDark: '#00B8CC',
  secondary: '#7B61FF',
  background: '#0B0D17',
  surface: '#15192B',
  surfaceLight: '#1E243D',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AABF',
  textMuted: '#637087',
  border: '#2A314A',
  success: '#00E676',
  warning: '#FFC400',
  error: '#FF3D00',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({ colors: mockColors, isDark: true }),
}));

jest.mock('lucide-react-native', () => ({
  ShieldAlert: () => null,
  CheckSquare: () => null,
  Square: () => null,
}));

describe('BackupReminderModal', () => {
  it('explains backup responsibility without revealing any key material', () => {
    const { getByText, queryByText } = render(
      <BackupReminderModal visible onAcknowledge={jest.fn()} />
    );

    getByText('Secure Your Wallet');
    getByText(/only way to access your/i);
    getByText(/PocketPay does not store your secret key on any servers/);
    getByText(/your funds are lost forever/);
    getByText(/Do not share your secret key with anyone/);

    // The reminder must never repeat key material — only the creation screen reveals it.
    expect(queryByText(/^S[A-Z2-7]{55}$/)).toBeNull();
  });

  it('keeps the acknowledge button disabled until the confirmation is checked', () => {
    const onAcknowledge = jest.fn();
    const { getByText, getByTestId } = render(
      <BackupReminderModal visible onAcknowledge={onAcknowledge} />
    );

    fireEvent.press(getByText('I Understand, Continue'));
    expect(onAcknowledge).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('backup-reminder-checkbox'));
    fireEvent.press(getByText('I Understand, Continue'));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('exposes the confirmation as an accessible checkbox that reflects its state', () => {
    const { getByTestId } = render(<BackupReminderModal visible onAcknowledge={jest.fn()} />);

    const checkbox = getByTestId('backup-reminder-checkbox');
    expect(checkbox.props.accessibilityState).toEqual({ checked: false });

    fireEvent.press(checkbox);
    expect(getByTestId('backup-reminder-checkbox').props.accessibilityState).toEqual({
      checked: true,
    });
  });

  it('resets the confirmation when the reminder is dismissed and shown again', () => {
    const { getByTestId, rerender } = render(
      <BackupReminderModal visible onAcknowledge={jest.fn()} />
    );

    fireEvent.press(getByTestId('backup-reminder-checkbox'));
    expect(getByTestId('backup-reminder-checkbox').props.accessibilityState).toEqual({
      checked: true,
    });

    rerender(<BackupReminderModal visible={false} onAcknowledge={jest.fn()} />);
    rerender(<BackupReminderModal visible onAcknowledge={jest.fn()} />);

    expect(getByTestId('backup-reminder-checkbox').props.accessibilityState).toEqual({
      checked: false,
    });
  });

  it('renders nothing while the reminder is not visible', () => {
    const { queryByText } = render(
      <BackupReminderModal visible={false} onAcknowledge={jest.fn()} />
    );

    expect(queryByText('Secure Your Wallet')).toBeNull();
  });
});
