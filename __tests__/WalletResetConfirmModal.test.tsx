import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

// Mock lucide icons to simplify render tests
jest.mock('lucide-react-native', () => ({
  ShieldAlert: () => null,
  AlertTriangle: () => null,
  KeyRound: () => null,
  Users: () => null,
  Clock: () => null,
  Settings: () => null,
  X: () => null,
}));

import { WalletResetConfirmModal } from '../src/components/WalletResetConfirmModal';

describe('WalletResetConfirmModal', () => {
  it('renders the destructive confirmation with a clear typed-phrase requirement', () => {
    const { getByText, getByLabelText } = render(
      <WalletResetConfirmModal visible onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    expect(getByText('Reset Wallet')).toBeTruthy();
    expect(getByText('Type "confirm reset" to confirm')).toBeTruthy();
    expect(getByLabelText('Delete Everything')).toBeTruthy();
  });

  it('keeps the destructive action disabled until the exact phrase is typed', () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <WalletResetConfirmModal visible onConfirm={onConfirm} onCancel={jest.fn()} />
    );

    const confirmButton = getByLabelText('Delete Everything');
    const input = getByPlaceholderText('confirm reset');

    // Wrong / partial phrase keeps the action blocked
    fireEvent.changeText(input, 'confirm');
    fireEvent.press(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.changeText(input, 'reset everything');
    fireEvent.press(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('enables reset only once the exact phrase is entered (case/whitespace-insensitive)', () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <WalletResetConfirmModal visible onConfirm={onConfirm} onCancel={jest.fn()} />
    );

    const confirmButton = getByLabelText('Delete Everything');
    const input = getByPlaceholderText('confirm reset');

    fireEvent.changeText(input, '  Confirm Reset  ');
    fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('exposes an accessible cancel action that does not require the phrase', () => {
    const onCancel = jest.fn();
    const { getByLabelText } = render(
      <WalletResetConfirmModal visible onConfirm={jest.fn()} onCancel={onCancel} />
    );

    fireEvent.press(getByLabelText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
