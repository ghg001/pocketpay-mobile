/**
 * Matured lock withdrawal flow.
 *
 * Drives the eligibility → confirm → submitting → success/failure sequence for
 * withdrawing a single matured vault lock. The hook owns the flow state; the
 * store owns the eligibility re-check and the transfer itself.
 *
 * SDK assumptions are documented in docs/vault-integration-assumptions.md
 * ("Matured lock withdrawal").
 */

import { useCallback, useMemo, useState } from 'react';
import { useVaultStore, Lock, MaturedLockWithdrawalResult } from '../../store/vaultStore';
import { useWalletStore } from '../../store/walletStore';
import {
  describeWithdrawalError,
  evaluateWithdrawalEligibility,
  toWithdrawalErrorCode,
  WithdrawalEligibility,
  WithdrawalErrorCopy,
} from './maturedLockWithdrawal';

export type WithdrawalStep = 'idle' | 'confirming' | 'submitting' | 'success' | 'failed';

export interface UseMaturedLockWithdrawalReturn {
  step: WithdrawalStep;
  eligibility: WithdrawalEligibility;
  /** True while no vault contract is configured, i.e. nothing moves on-chain. */
  isPreview: boolean;
  /** Populated once the withdrawal succeeds. */
  result: MaturedLockWithdrawalResult | null;
  /** Populated once the withdrawal fails. */
  error: WithdrawalErrorCopy | null;
  /** Open the confirmation step. No-op when the lock is not eligible. */
  start: () => void;
  /** Submit the withdrawal from the confirmation step. */
  confirm: () => Promise<void>;
  /** Leave the confirmation step. Ignored while submitting. */
  cancel: () => void;
  /** Re-attempt a failed withdrawal. */
  retry: () => Promise<void>;
  /** Close the flow from any terminal step. */
  close: () => void;
}

export function useMaturedLockWithdrawal(lock: Lock): UseMaturedLockWithdrawalReturn {
  const publicKey = useWalletStore((state) => state.publicKey);
  const getSecretKey = useWalletStore((state) => state.getSecretKey);
  const withdrawMaturedLock = useVaultStore((state) => state.withdrawMaturedLock);
  const isConfigured = useVaultStore((state) => state.isConfigured);

  const [step, setStep] = useState<WithdrawalStep>('idle');
  const [result, setResult] = useState<MaturedLockWithdrawalResult | null>(null);
  const [error, setError] = useState<WithdrawalErrorCopy | null>(null);

  const eligibility = useMemo(
    () => evaluateWithdrawalEligibility(lock, { publicKey }),
    // `unlockDate`/`amount` drive the result; recompute when either changes.
    [lock.amount, lock.unlockDate, publicKey]
  );

  const start = useCallback(() => {
    if (!eligibility.isEligible) return;
    setError(null);
    setResult(null);
    setStep('confirming');
  }, [eligibility.isEligible]);

  const submit = useCallback(async () => {
    setError(null);
    setStep('submitting');
    try {
      const withdrawal = await withdrawMaturedLock(lock.id, { publicKey, getSecretKey });
      setResult(withdrawal);
      setStep('success');
    } catch (caught) {
      setError(describeWithdrawalError(toWithdrawalErrorCode(caught)));
      setStep('failed');
    }
  }, [lock.id, publicKey, getSecretKey, withdrawMaturedLock]);

  const confirm = useCallback(async () => {
    // Guard against a double tap on the confirm button.
    if (step === 'submitting') return;
    await submit();
  }, [step, submit]);

  const cancel = useCallback(() => {
    if (step === 'submitting') return;
    setStep('idle');
  }, [step]);

  const retry = useCallback(async () => {
    if (step !== 'failed') return;
    await submit();
  }, [step, submit]);

  const close = useCallback(() => {
    if (step === 'submitting') return;
    setStep('idle');
    setError(null);
    setResult(null);
  }, [step]);

  return {
    step,
    eligibility,
    isPreview: !isConfigured,
    result,
    error,
    start,
    confirm,
    cancel,
    retry,
    close,
  };
}
