import {
  redactSensitiveString,
  redactSensitiveValue,
  sanitizeError,
  REDACTED_SECRET,
  REDACTED_PUBLIC_KEY,
  REDACTED_MNEMONIC,
  REDACTED_VALUE,
} from '../redactSensitive';

describe('redactSensitiveString', () => {
  it('redacts Stellar secret keys', () => {
    const secret = 'S' + 'A'.repeat(55);
    expect(redactSensitiveString(`failed with ${secret}`)).toBe(
      `failed with ${REDACTED_SECRET}`
    );
  });

  it('redacts Stellar public keys', () => {
    const pub = 'G' + 'B'.repeat(55);
    expect(redactSensitiveString(`account ${pub}`)).toBe(
      `account ${REDACTED_PUBLIC_KEY}`
    );
  });

  it('redacts mnemonic-like phrases', () => {
    const mnemonic =
      'abandon ability able about above absent absorb abstract absurd abuse access accident';
    expect(redactSensitiveString(mnemonic)).toBe(REDACTED_MNEMONIC);
  });

  it('leaves ordinary error messages intact', () => {
    expect(redactSensitiveString('Network request failed')).toBe(
      'Network request failed'
    );
  });
});

describe('redactSensitiveValue', () => {
  it('redacts sensitive object keys wholesale', () => {
    const result = redactSensitiveValue({
      secretKey: 'S' + 'C'.repeat(55),
      amount: '10',
    }) as Record<string, unknown>;

    expect(result.secretKey).toBe(REDACTED_VALUE);
    expect(result.amount).toBe('10');
  });

  it('recurses into nested structures', () => {
    const pub = 'G' + 'D'.repeat(55);
    const result = redactSensitiveValue({
      nested: { msg: `pk=${pub}` },
    }) as { nested: { msg: string } };

    expect(result.nested.msg).toBe(`pk=${REDACTED_PUBLIC_KEY}`);
  });
});

describe('sanitizeError', () => {
  it('returns a redacted name/message/stack snapshot', () => {
    const secret = 'S' + 'E'.repeat(55);
    const err = new Error(`boom ${secret}`);
    err.name = 'WalletError';
    err.stack = `WalletError: boom ${secret}\n    at foo`;

    const sanitized = sanitizeError(err);
    expect(sanitized.name).toBe('WalletError');
    expect(sanitized.message).toBe(`boom ${REDACTED_SECRET}`);
    expect(sanitized.stack).toContain(REDACTED_SECRET);
    expect(sanitized.stack).not.toContain(secret);
  });
});
