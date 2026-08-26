import {
  evaluateVaultAvailability,
  describeUnavailableReason,
  VaultUnavailableReason,
} from '../vaultAvailability';

describe('evaluateVaultAvailability', () => {
  it('returns isAvailable true when wallet is loaded and flag is default/true', () => {
    const result = evaluateVaultAvailability({
      publicKey: 'GPUBLIC123',
      isVaultConfigured: true,
    });
    expect(result.isAvailable).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.isContractConfigured).toBe(true);
  });

  it('returns isAvailable false with no-wallet reason when publicKey is null', () => {
    const result = evaluateVaultAvailability({
      publicKey: null,
      isVaultConfigured: true,
    });
    expect(result.isAvailable).toBe(false);
    expect(result.reasons).toEqual(['no-wallet']);
  });

  it('returns isAvailable false with feature-disabled reason when flag is false', () => {
    const result = evaluateVaultAvailability({
      publicKey: 'GPUBLIC123',
      isVaultConfigured: true,
      vaultEnabledFlag: 'false',
    });
    expect(result.isAvailable).toBe(false);
    expect(result.reasons).toEqual(['feature-disabled']);
  });

  it('returns isAvailable false with feature-disabled reason when flag is 0', () => {
    const result = evaluateVaultAvailability({
      publicKey: 'GPUBLIC123',
      isVaultConfigured: false,
      vaultEnabledFlag: '0',
    });
    expect(result.isAvailable).toBe(false);
    expect(result.reasons).toEqual(['feature-disabled']);
  });

  it('returns multiple reasons when both flag is false and wallet is missing', () => {
    const result = evaluateVaultAvailability({
      publicKey: null,
      isVaultConfigured: false,
      vaultEnabledFlag: 'false',
    });
    expect(result.isAvailable).toBe(false);
    expect(result.reasons).toEqual(['feature-disabled', 'no-wallet']);
    expect(result.isContractConfigured).toBe(false);
  });

  it('mirrors isVaultConfigured input correctly in isContractConfigured', () => {
    const configured = evaluateVaultAvailability({
      publicKey: 'GPUBLIC123',
      isVaultConfigured: true,
    });
    expect(configured.isContractConfigured).toBe(true);

    const unconfigured = evaluateVaultAvailability({
      publicKey: 'GPUBLIC123',
      isVaultConfigured: false,
    });
    expect(unconfigured.isContractConfigured).toBe(false);
  });
});

describe('describeUnavailableReason', () => {
  const reasons: VaultUnavailableReason[] = ['no-wallet', 'feature-disabled', 'sdk-not-ready'];

  reasons.forEach((reason) => {
    it(`returns non-empty title and message for ${reason}`, () => {
      const copy = describeUnavailableReason(reason);
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.message.length).toBeGreaterThan(0);
    });
  });
});
