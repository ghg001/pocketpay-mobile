import { buildReceivePayload, isPaymentRequestPayload } from '../src/features/receive/qrPayload';

const DESTINATION = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV';

describe('buildReceivePayload', () => {
  it('returns the bare address when no amount, asset, or memo is given', () => {
    const payload = buildReceivePayload({ destination: DESTINATION });

    expect(payload).toBe(DESTINATION);
    expect(isPaymentRequestPayload(payload)).toBe(false);
  });

  it('switches to a web+stellar:pay URI once an amount is requested', () => {
    const payload = buildReceivePayload({ destination: DESTINATION, amount: '10.5' });

    expect(payload).toBe(`web+stellar:pay?destination=${DESTINATION}&amount=10.5`);
    expect(isPaymentRequestPayload(payload)).toBe(true);
  });

  it('includes memo and defaults memo_type to MEMO_TEXT', () => {
    const payload = buildReceivePayload({ destination: DESTINATION, memo: 'Invoice 42' });

    const parsed = new URLSearchParams(payload.split('?')[1]);
    expect(parsed.get('destination')).toBe(DESTINATION);
    expect(parsed.get('memo')).toBe('Invoice 42');
    expect(parsed.get('memo_type')).toBe('MEMO_TEXT');
  });

  it('honours an explicit memo_type', () => {
    const payload = buildReceivePayload({
      destination: DESTINATION,
      memo: '12345',
      memoType: 'MEMO_ID',
    });

    const parsed = new URLSearchParams(payload.split('?')[1]);
    expect(parsed.get('memo_type')).toBe('MEMO_ID');
  });

  it('includes asset_code and asset_issuer together for an issued asset', () => {
    const payload = buildReceivePayload({
      destination: DESTINATION,
      amount: '5',
      assetCode: 'USDC',
      assetIssuer: 'GISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSU',
    });

    const parsed = new URLSearchParams(payload.split('?')[1]);
    expect(parsed.get('asset_code')).toBe('USDC');
    expect(parsed.get('asset_issuer')).toBe('GISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSU');
  });

  it('drops asset_code when asset_issuer is missing, per SEP-0007 (a code alone is ambiguous)', () => {
    const payload = buildReceivePayload({
      destination: DESTINATION,
      amount: '5',
      assetCode: 'USDC',
    });

    expect(payload).not.toContain('asset_code');
    expect(payload).not.toContain('USDC');
  });

  it('combines amount, asset, and memo in one payload', () => {
    const payload = buildReceivePayload({
      destination: DESTINATION,
      amount: '100',
      assetCode: 'USDC',
      assetIssuer: 'GISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSU',
      memo: 'Order 7',
    });

    const parsed = new URLSearchParams(payload.split('?')[1]);
    expect(parsed.get('destination')).toBe(DESTINATION);
    expect(parsed.get('amount')).toBe('100');
    expect(parsed.get('asset_code')).toBe('USDC');
    expect(parsed.get('asset_issuer')).toBe('GISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSUERISSU');
    expect(parsed.get('memo')).toBe('Order 7');
    expect(parsed.get('memo_type')).toBe('MEMO_TEXT');
  });

  it('trims whitespace from amount and memo before encoding', () => {
    const payload = buildReceivePayload({
      destination: DESTINATION,
      amount: '  10  ',
      memo: '  hello  ',
    });

    const parsed = new URLSearchParams(payload.split('?')[1]);
    expect(parsed.get('amount')).toBe('10');
    expect(parsed.get('memo')).toBe('hello');
  });

  it('treats a whitespace-only amount and memo as absent (stays address-only)', () => {
    const payload = buildReceivePayload({
      destination: DESTINATION,
      amount: '   ',
      memo: '   ',
    });

    expect(payload).toBe(DESTINATION);
  });

  it('percent-encodes special characters in the memo', () => {
    const payload = buildReceivePayload({ destination: DESTINATION, memo: 'a&b=c d' });

    const parsed = new URLSearchParams(payload.split('?')[1]);
    expect(parsed.get('memo')).toBe('a&b=c d');
    expect(payload).not.toContain(' ');
  });
});
