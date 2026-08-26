import React from 'react';
import { render } from '@testing-library/react-native';
import { FundingStatusBanner } from '../src/components/FundingStatusBanner';
import { walletReadinessFixtures } from '../tests/fixtures';

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
  Zap: () => null,
  AlertTriangle: () => null,
  Loader2: () => null,
  CheckCircle: () => null,
  Info: () => null,
}));

describe('FundingStatusBanner', () => {
  it('shows a checking message for the idle wallet-readiness fixture', () => {
    const { getByText } = render(
      <FundingStatusBanner status={walletReadinessFixtures.idle.fundingStatus} />
    );

    getByText('Checking account status…');
  });

  it('offers a fund button for the unfunded wallet-readiness fixture', () => {
    const onFund = jest.fn();
    const { getByText } = render(
      <FundingStatusBanner
        status={walletReadinessFixtures.unfunded.fundingStatus}
        onFund={onFund}
      />
    );

    getByText('Unfunded Testnet Account');
    getByText('Fund with Friendbot');
  });

  it('shows the funded banner, with no fund button, for the readyToPay wallet-readiness fixture', () => {
    const { getByText, queryByText } = render(
      <FundingStatusBanner status={walletReadinessFixtures.readyToPay.fundingStatus} />
    );

    getByText('Account funded');
    expect(queryByText('Fund with Friendbot')).toBeNull();
  });

  it('shows the funded banner for a funded account even with a zero balance', () => {
    // fundedZeroBalance and readyToPay share fundingStatus:'funded' but
    // differ in balance — the banner only cares about funding status.
    const { getByText } = render(
      <FundingStatusBanner status={walletReadinessFixtures.fundedZeroBalance.fundingStatus} />
    );

    getByText('Account funded');
  });
});
