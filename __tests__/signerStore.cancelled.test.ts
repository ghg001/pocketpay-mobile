import { useSignerStore } from '../src/store/signerStore';

describe('signer store cancellation state', () => {
  beforeEach(() => {
    useSignerStore.getState().reset();
  });

  it('keeps cancellation separate from failure and clears review state safely', () => {
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

    store.completeSigning({
      hash: 'abc123',
      review: useSignerStore.getState().currentReview!,
      signerType: 'local',
      completedAt: new Date().toISOString(),
    });

    store.cancelSigning();

    expect(useSignerStore.getState().phase).toBe('cancelled');
    expect(useSignerStore.getState().error).toBeNull();
    expect(useSignerStore.getState().currentReview).toBeNull();
    expect(useSignerStore.getState().lastResult).toBeNull();
  });
});
