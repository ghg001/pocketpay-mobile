import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VaultUnavailableState } from '../src/components/VaultUnavailableState';

jest.mock('lucide-react-native', () => ({
  XCircle: () => null,
}));

describe('VaultUnavailableState', () => {
  it('renders the title and primary message for no-wallet reason', () => {
    const { getByText } = render(
      <VaultUnavailableState reasons={['no-wallet']} />
    );

    expect(getByText('Vault Unavailable')).toBeTruthy();
    expect(getByText('Create or import a wallet to use the Soroban Savings Vault.')).toBeTruthy();
  });

  it('renders detail boxes for multiple reasons', () => {
    const { getByTestId, getByText } = render(
      <VaultUnavailableState reasons={['feature-disabled', 'no-wallet']} />
    );

    expect(getByTestId('reason-detail-feature-disabled')).toBeTruthy();
    expect(getByTestId('reason-detail-no-wallet')).toBeTruthy();
    expect(getByText('EXPO_PUBLIC_VAULT_ENABLED is set to false.')).toBeTruthy();
  });

  it('calls onNavigateToSettings when Go to Settings button is pressed', () => {
    const onNavigateToSettings = jest.fn();
    const { getByText } = render(
      <VaultUnavailableState
        reasons={['no-wallet']}
        onNavigateToSettings={onNavigateToSettings}
      />
    );

    const button = getByText('Go to Settings');
    fireEvent.press(button);
    expect(onNavigateToSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when Try Again button is pressed for feature-disabled reason', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <VaultUnavailableState
        reasons={['feature-disabled']}
        onRetry={onRetry}
      />
    );

    const button = getByText('Try Again');
    fireEvent.press(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the docs reference link', () => {
    const { getByText } = render(
      <VaultUnavailableState reasons={['no-wallet']} />
    );

    expect(getByText('See docs/vault-ui-guidance.md for more information.')).toBeTruthy();
  });
});
