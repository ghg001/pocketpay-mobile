import { classifyVaultError, describeVaultError, type VaultErrorCode } from '../vaultErrors';

describe('describeVaultError', () => {
  it.each([
    ['validation', 'Invalid Input'],
    ['unsupported-feature', 'Feature Unavailable'],
    ['network', 'Network Problem'],
    ['signing-rejected', 'Signing Cancelled'],
    ['contract-error', 'Contract Error'],
    ['secret-unavailable', 'Could Not Access Wallet Key'],
    ['insufficient-balance', 'Insufficient Balance'],
    ['reserve-not-met', 'Reserve Not Met'],
    ['lock-not-found', 'Lock Unavailable'],
    ['not-matured', 'Lock Not Ready'],
    ['unknown', 'Vault Action Failed'],
  ] as [VaultErrorCode, string][])(
    'returns correct title for code "%s"',
    (code, expectedTitle) => {
      const guidance = describeVaultError(code);
      expect(guidance.title).toBe(expectedTitle);
    }
  );

  it('marks retryable codes appropriately', () => {
    expect(describeVaultError('network').canRetry).toBe(true);
    expect(describeVaultError('signing-rejected').canRetry).toBe(true);
    expect(describeVaultError('contract-error').canRetry).toBe(true);
    expect(describeVaultError('validation').canRetry).toBe(false);
    expect(describeVaultError('insufficient-balance').canRetry).toBe(false);
  });

  it('marks navigate-back codes appropriately', () => {
    expect(describeVaultError('validation').shouldNavigateBack).toBe(true);
    expect(describeVaultError('insufficient-balance').shouldNavigateBack).toBe(true);
    expect(describeVaultError('secret-unavailable').shouldNavigateBack).toBe(true);
    expect(describeVaultError('lock-not-found').shouldNavigateBack).toBe(false);
    expect(describeVaultError('network').shouldNavigateBack).toBe(false);
  });
});

describe('classifyVaultError', () => {
  describe('network errors', () => {
    it('classifies ECONNREFUSED', () => {
      const result = classifyVaultError(new Error('ECONNREFUSED'));
      expect(result.title).toBe('Network Problem');
      expect(result.canRetry).toBe(true);
    });

    it('classifies timeout errors', () => {
      const result = classifyVaultError(new Error('Request timeout'));
      expect(result.title).toBe('Network Problem');
    });

    it('classifies ENOTFOUND', () => {
      const result = classifyVaultError(new Error('ENOTFOUND stellar.org'));
      expect(result.title).toBe('Network Problem');
    });

    it('classifies fetch failed', () => {
      const result = classifyVaultError(new Error('fetch failed'));
      expect(result.title).toBe('Network Problem');
    });
  });

  describe('signing rejection', () => {
    it('classifies user denied', () => {
      const result = classifyVaultError(new Error('user denied'));
      expect(result.title).toBe('Signing Cancelled');
    });

    it('classifies cancelled', () => {
      const result = classifyVaultError(new Error('Transaction cancelled'));
      expect(result.title).toBe('Signing Cancelled');
    });
  });

  describe('Stellar result codes', () => {
    it('classifies op_underfunded', () => {
      const result = classifyVaultError(new Error('op_underfunded'));
      expect(result.title).toBe('Insufficient Balance');
    });

    it('classifies insufficient funds', () => {
      const result = classifyVaultError(new Error('insufficient funds'));
      expect(result.title).toBe('Insufficient Balance');
    });

    it('classifies op_low_reserve', () => {
      const result = classifyVaultError(new Error('op_low_reserve'));
      expect(result.title).toBe('Reserve Not Met');
    });

    it('classifies tx_bad_auth', () => {
      const result = classifyVaultError(new Error('tx_bad_auth'));
      expect(result.title).toBe('Could Not Access Wallet Key');
    });
  });

  describe('contract errors', () => {
    it('classifies contract error', () => {
      const result = classifyVaultError(new Error('contract execution failed'));
      expect(result.title).toBe('Contract Error');
    });

    it('classifies soroban error', () => {
      const result = classifyVaultError(new Error('soroban runtime error'));
      expect(result.title).toBe('Contract Error');
    });

    it('classifies simulation failed', () => {
      const result = classifyVaultError(new Error('Simulation failed'));
      expect(result.title).toBe('Contract Error');
    });
  });

  describe('validation errors', () => {
    it('classifies invalid amount', () => {
      const result = classifyVaultError(new Error('Invalid amount'));
      expect(result.title).toBe('Invalid Input');
    });

    it('classifies must be positive', () => {
      const result = classifyVaultError(new Error('Must be a positive number'));
      expect(result.title).toBe('Invalid Input');
    });
  });

  describe('secret key errors', () => {
    it('classifies secret key errors', () => {
      const result = classifyVaultError(new Error('Could not read secret'));
      expect(result.title).toBe('Could Not Access Wallet Key');
    });
  });

  describe('unsupported feature', () => {
    it('classifies not supported', () => {
      const result = classifyVaultError(new Error('Feature not supported'));
      expect(result.title).toBe('Feature Unavailable');
    });
  });

  describe('fallback', () => {
    it('returns unknown guidance for unrecognised errors', () => {
      const result = classifyVaultError(new Error('Something weird happened'));
      expect(result.title).toBe('Vault Action Failed');
      expect(result.canRetry).toBe(true);
    });

    it('handles string errors', () => {
      const result = classifyVaultError('raw string error');
      expect(result.title).toBe('Vault Action Failed');
    });

    it('handles null/undefined gracefully', () => {
      const result = classifyVaultError(null);
      expect(result.title).toBe('Vault Action Failed');
    });

    it('handles object with message property', () => {
      const result = classifyVaultError({ message: 'network timeout' });
      expect(result.title).toBe('Network Problem');
    });
  });

  describe('secret redaction', () => {
    it('redacts secret keys from messages', () => {
      const secret = 'S' + 'A'.repeat(55);
      const result = classifyVaultError(new Error(`auth failed with ${secret}`));
      expect(result.message).not.toContain(secret);
    });
  });
});
