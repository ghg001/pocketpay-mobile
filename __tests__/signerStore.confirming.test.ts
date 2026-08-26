import { useSignerStore } from '../src/store/signerStore';

describe('signer store confirming phase', () => {
  beforeEach(() => {
    useSignerStore.getState().reset();
  });

  it('enters confirming between submitting and completed', () => {
    const store = useSignerStore.getState();

    store.startReview({
      requestId: 'req-1',
      sourcePublicKey: 'GSOURCE',
      destinationPublicKey: 'GDEST',
      amount: '10',
      assetCode: 'XLM',
      network: 'Testnet',
      createdAt: new Date().toISOString(),
      timeoutSeconds: 30,
    });

    store.enterHandoff();
    store.enterSigning();
    store.enterSubmitting();
    expect(useSignerStore.getState().phase).toBe('submitting');

    store.enterConfirming();
    expect(useSignerStore.getState().phase).toBe('confirming');

    store.completeSigning({
      hash: 'abc123',
      review: useSignerStore.getState().currentReview!,
      signerType: 'local',
      completedAt: new Date().toISOString(),
    });

    expect(useSignerStore.getState().phase).toBe('completed');
  });

  it('keeps confirming separate from failed when submission never resolves cleanly', () => {
    const store = useSignerStore.getState();

    store.startReview({
      requestId: 'req-2',
      sourcePublicKey: 'GSOURCE',
      destinationPublicKey: 'GDEST',
      amount: '10',
      assetCode: 'XLM',
      network: 'Testnet',
      createdAt: new Date().toISOString(),
      timeoutSeconds: 30,
    });

    store.enterHandoff();
    store.enterSigning();
    store.enterSubmitting();
    store.enterConfirming();

    store.failSigning({ type: 'network_error', message: 'Could not confirm submission.' });

    expect(useSignerStore.getState().phase).toBe('failed');
  });
});
