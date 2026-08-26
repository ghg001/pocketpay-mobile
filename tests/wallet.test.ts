import { walletFixture, balanceFixture, contactsFixture, transactionFixtures, errorFixtures } from './fixtures';

describe('Wallet Fixtures', () => {
  it('walletFixture should have a valid public key', () => {
    expect(walletFixture.publicKey).toMatch(/^G[A-Z0-9]{55}$/);
  });

  it('walletFixture should not contain a secret key', () => {
    expect(walletFixture).not.toHaveProperty('secretKey');
  });

  it('balanceFixture should have XLM balance', () => {
    const xlm = balanceFixture.balances.find(b => b.asset_type === 'native');
    expect(xlm).toBeDefined();
    expect(xlm?.balance).toBe('1000.0000000');
  });

  it('contactsFixture should have valid addresses', () => {
    contactsFixture.forEach(contact => {
      expect(contact.address).toMatch(/^G[A-Z0-9]{55}$/);
    });
  });

  it('transactionFixtures should have valid hashes', () => {
    transactionFixtures.forEach(tx => {
      expect(tx.hash).toHaveLength(64);
    });
  });

  it('errorFixtures should have expected error types', () => {
    expect(errorFixtures.networkError.code).toBe('ECONNRESET');
    expect(errorFixtures.rateLimitError.status).toBe(429);
    expect(errorFixtures.accountNotFound.status).toBe(404);
    expect(errorFixtures.insufficientBalance.code).toBe('tx_insufficient_balance');
  });
});
