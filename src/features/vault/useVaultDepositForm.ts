/**
 * Vault deposit form hook.
 *
 * For integration risks, assumptions, and coordination notes,
 * see docs/vault-integration-risks.md.
 */

import { useState } from 'react';
import { validateAmount } from '../../utils/validation';
import { WALLET_SECRET_ACCESS_MESSAGE } from '../../utils/walletStorageErrors';

export interface UseVaultDepositFormReturn {
  amount: string;
  amountError: string | undefined;
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError: string | undefined;
  setAmount: (value: string) => void;
  setAmountError: (value: string | undefined) => void;
  validate: (walletBalance?: string) => boolean;
  submit: (
    publicKey: string,
    getSecretKey: () => Promise<string | null>,
    depositFn: (secret: string, publicKey: string, amount: string) => Promise<string | null>,
    walletBalance?: string
  ) => Promise<string | null>;
  reset: () => void;
}

export function useVaultDepositForm(): UseVaultDepositFormReturn {
  const [amount, setAmountState] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const setAmount = (value: string) => {
    setAmountState(value);
    setAmountError(value.trim() ? validateAmount(value) ?? undefined : undefined);
    setSubmitError(undefined);
    setIsSuccess(false);
  };

  const validate = (walletBalance?: string): boolean => {
    const error = validateAmount(amount, walletBalance);
    setAmountError(error ?? undefined);
    return !error;
  };

  const submit = async (
    publicKey: string,
    getSecretKey: () => Promise<string | null>,
    depositFn: (secret: string, publicKey: string, amount: string) => Promise<string | null>,
    walletBalance?: string
  ): Promise<string | null> => {
    if (!validate(walletBalance)) {
      return null;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);
    setIsSuccess(false);

    try {
      const secret = await getSecretKey();
      if (!secret) {
        throw new Error(WALLET_SECRET_ACCESS_MESSAGE);
      }

      const hash = await depositFn(secret, publicKey, amount);
      setIsSuccess(true);
      setAmountState('');
      setAmountError(undefined);
      return hash;
    } catch (err: any) {
      if (err.message !== 'USER_CANCELLED') {
        const errMsg = err.message || 'Deposit failed';
        setSubmitError(errMsg);
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setAmountState('');
    setAmountError(undefined);
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmitError(undefined);
  };

  return {
    amount,
    amountError,
    isSubmitting,
    isSuccess,
    submitError,
    setAmount,
    setAmountError,
    validate,
    submit,
    reset,
  };
}
