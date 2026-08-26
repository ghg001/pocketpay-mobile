import type { BalanceState, FundingStatus } from '../../src/types/balance';
import type { TransactionStatus } from '../../src/store/walletStore';

/**
 * Payment-readiness scenarios: the combination of balance and account-funding
 * state that determines whether a send/payment flow can proceed. Mirrors the
 * states `walletStore` actually produces (see `types/balance.ts`), so a test
 * asserting against these fixtures can't drift from what the store emits.
 */
export interface WalletReadiness {
  balanceState: BalanceState;
  fundingStatus: FundingStatus;
  balance: string;
}

export const walletReadinessFixtures: Record<string, WalletReadiness> = {
  /** Freshly opened app, before any balance fetch has run. */
  idle: { balanceState: 'idle', fundingStatus: 'unknown', balance: '0.0000000' },
  /** A fetch is in flight — payment actions should be disabled while loading. */
  loading: { balanceState: 'loading', fundingStatus: 'checking', balance: '0.0000000' },
  /** Ready to pay: funded account with a positive balance. */
  readyToPay: { balanceState: 'available', fundingStatus: 'funded', balance: '1000.0000000' },
  /** Funded account but a zero balance — can receive, can't send. */
  fundedZeroBalance: { balanceState: 'available', fundingStatus: 'funded', balance: '0.0000000' },
  /** Account has never been funded on the Stellar network. */
  unfunded: { balanceState: 'available', fundingStatus: 'unfunded', balance: '0.0000000' },
  /** Last balance fetch failed — funds are safe, but the UI can't show a number. */
  balanceUnavailable: { balanceState: 'unavailable', fundingStatus: 'funded', balance: '0.0000000' },
};

/** A single outgoing payment attempt, at each stage of its lifecycle. */
export interface PaymentAttemptFixture {
  destination: string;
  amount: string;
  status: TransactionStatus;
}

export const paymentAttemptFixtures: Record<string, PaymentAttemptFixture> = {
  pending: {
    destination: 'GDNOEY2L6EGCMAYNZWJN6K3K6TJJKAKNQJQJWY5HXLFY3LJQY7JJ6NVD',
    amount: '25.0000000',
    status: 'pending',
  },
  confirmed: {
    destination: 'GDNOEY2L6EGCMAYNZWJN6K3K6TJJKAKNQJQJWY5HXLFY3LJQY7JJ6NVD',
    amount: '25.0000000',
    status: 'confirmed',
  },
  failed: {
    destination: 'GDNOEY2L6EGCMAYNZWJN6K3K6TJJKAKNQJQJWY5HXLFY3LJQY7JJ6NVD',
    amount: '25.0000000',
    status: 'failed',
  },
};
