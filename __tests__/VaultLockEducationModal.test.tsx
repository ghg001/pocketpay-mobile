import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VaultLockEducationModal } from '../src/components/VaultLockEducationModal';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#00E5FF',
      secondary: '#7B61FF',
      background: '#0B0E14',
      surface: '#161B22',
      surfaceLight: '#21262D',
      textPrimary: '#FFFFFF',
      textSecondary: '#8B949E',
      textMuted: '#484F58',
      border: '#30363D',
      success: '#00E676',
      warning: '#FFC400',
      error: '#FF3D00',
    },
  }),
}));

jest.mock('lucide-react-native', () => ({
  Lock: () => null,
  Clock: () => null,
  AlertCircle: () => null,
  X: () => null,
  ArrowRight: () => null,
  CheckCircle: () => null,
  Wallet: () => null,
}));

describe('VaultLockEducationModal', () => {
  it('renders education modal with all required information criteria', () => {
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <VaultLockEducationModal visible={true} onClose={onCloseMock} />
    );

    expect(getByText('Understanding Locked Funds')).toBeTruthy();
    expect(getByText('Why are funds locked?')).toBeTruthy();
    expect(getByText('When do funds become withdrawable?')).toBeTruthy();
    expect(getByText('How is unlock timing determined?')).toBeTruthy();
    expect(getByText('Testnet preview notice')).toBeTruthy();
  });

  it('calls onClose when Got it button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <VaultLockEducationModal visible={true} onClose={onCloseMock} />
    );

    fireEvent.press(getByText('Got it'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
