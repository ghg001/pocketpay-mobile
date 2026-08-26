import { useCallback, useState } from 'react';
import type { VaultActionState, VaultActionStatus } from '../types/vault';

interface VaultActionSteps<TSigned, TResult> {
  sign: () => Promise<TSigned>;
  submit: (signed: TSigned) => Promise<{ txHash: string }>;
  confirm: (txHash: string) => Promise<TResult>;
}

/**
 * useVaultAction
 *
 * Drives a single vault action (deposit, lock, or withdraw) through a
 * well-defined progress state machine: signing -> submission -> pending -> confirmed.
 * Failure at any step transitions to 'failed' with the error message attached.
 *
 * Reusable across all vault action types — pass in the sign/submit/confirm
 * functions specific to the action being performed.
 */
export function useVaultAction<TSigned = unknown, TResult = unknown>() {
  const [status, setStatus] = useState<VaultActionStatus>({ state: 'idle' });

  const run = useCallback(async (steps: VaultActionSteps<TSigned, TResult>) => {
    try {
      setStatus({ state: 'signing' });
      const signed = await steps.sign();

      setStatus({ state: 'submission' });
      const { txHash } = await steps.submit(signed);

      setStatus({ state: 'pending', txHash });
      await steps.confirm(txHash);

      setStatus((prev) => ({ state: 'confirmed', txHash: prev.txHash }));
    } catch (err) {
      setStatus({
        state: 'failed',
        error: err instanceof Error ? err.message : 'Action failed. Please try again.',
      });
    }
  }, []);

  const reset = useCallback(() => setStatus({ state: 'idle' }), []);

  const state: VaultActionState = status.state;
  const isBusy = state === 'signing' || state === 'submission' || state === 'pending';

  return { status, state, isBusy, run, reset };
}
