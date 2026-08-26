/**
 * Payment receipt view-model tests (issue #216).
 *
 * Covers the pure receipt formatting the success screen relies on but that the
 * existing suite only exercises indirectly through the rendered screen:
 * - "shows transaction details": amount (+unit), date, destination.
 * - "hash can be copied": the full hash is preserved untouched.
 * - "explorer link where configured": hasExplorerLink reflects the input.
 * - "missing data handled gracefully": every field degrades to a placeholder.
 * - "UI remains non-technical / avoid raw payloads": the displayed hash is
 *   truncated, never the raw full-length value.
 */

import {
  buildPaymentReceipt,
  formatReceiptAmount,
  formatReceiptDate,
  truncateHash,
  RECEIPT_PLACEHOLDER,
  HASH_LEAD,
  HASH_TAIL,
} from '../src/features/transactions/receipt';

const TX_HASH = 'a1b2c3d4e5f6abcdef1234567890abcdef1234567890abcdef1234567890ab';
const DESTINATION = 'GBXXXXVALIDSTELLARADDRESS1234567890ABCDEFGHIJKLMNOPQRSTUVWX';
const EXPLORER_URL = 'https://stellar.expert/explorer/testnet/tx/' + TX_HASH;

describe('formatReceiptAmount', () => {
  it('appends the XLM unit to a valid amount', () => {
    expect(formatReceiptAmount('25')).toBe('25 XLM');
  });

  it('preserves decimal formatting from formatAmount', () => {
    expect(formatReceiptAmount('1234.5')).toBe('1,234.5 XLM');
  });

  it('returns the placeholder (with no unit) for missing amounts', () => {
    expect(formatReceiptAmount(undefined)).toBe(RECEIPT_PLACEHOLDER);
    expect(formatReceiptAmount(null)).toBe(RECEIPT_PLACEHOLDER);
    expect(formatReceiptAmount('')).toBe(RECEIPT_PLACEHOLDER);
  });

  it('returns the placeholder for non-numeric amounts', () => {
    expect(formatReceiptAmount('xyz')).toBe(RECEIPT_PLACEHOLDER);
  });
});

describe('formatReceiptDate', () => {
  it('formats a valid date and includes the year', () => {
    const out = formatReceiptDate('2026-07-26T15:40:00.000Z');
    expect(out).not.toBe(RECEIPT_PLACEHOLDER);
    expect(out).toContain('2026');
  });

  it('returns the placeholder for a missing date', () => {
    expect(formatReceiptDate(undefined)).toBe(RECEIPT_PLACEHOLDER);
    expect(formatReceiptDate(null)).toBe(RECEIPT_PLACEHOLDER);
    expect(formatReceiptDate('')).toBe(RECEIPT_PLACEHOLDER);
  });

  it('returns the placeholder for an invalid date', () => {
    expect(formatReceiptDate('invalid-date-string')).toBe(RECEIPT_PLACEHOLDER);
  });
});

describe('truncateHash', () => {
  it('keeps the leading and trailing characters and shortens the value', () => {
    const out = truncateHash(TX_HASH);
    expect(out.startsWith(TX_HASH.slice(0, HASH_LEAD))).toBe(true);
    expect(out.endsWith(TX_HASH.slice(TX_HASH.length - HASH_TAIL))).toBe(true);
    expect(out).not.toBe(TX_HASH);
    expect(out.length).toBeLessThan(TX_HASH.length);
  });

  it('returns short values unchanged', () => {
    expect(truncateHash('abcdef')).toBe('abcdef');
  });

  it('returns the placeholder for a missing hash', () => {
    expect(truncateHash(undefined)).toBe(RECEIPT_PLACEHOLDER);
    expect(truncateHash(null)).toBe(RECEIPT_PLACEHOLDER);
    expect(truncateHash('')).toBe(RECEIPT_PLACEHOLDER);
  });
});

describe('buildPaymentReceipt', () => {
  it('produces display-ready details for a complete receipt', () => {
    const vm = buildPaymentReceipt({
      hash: TX_HASH,
      amount: '25',
      destination: DESTINATION,
      date: '2026-07-26T15:40:00.000Z',
      destinationLabel: 'Alice',
      explorerUrl: EXPLORER_URL,
    });
    expect(vm.displayAmount).toBe('25 XLM');
    expect(vm.displayDestination).toBe(DESTINATION);
    expect(vm.destinationLabel).toBe('Alice');
    expect(vm.displayDate).toContain('2026');
    expect(vm.canCopyHash).toBe(true);
    expect(vm.hasExplorerLink).toBe(true);
    expect(vm.explorerUrl).toBe(EXPLORER_URL);
  });

  it('preserves the full hash for copying while displaying a truncated form', () => {
    const vm = buildPaymentReceipt({ hash: TX_HASH });
    expect(vm.fullHash).toBe(TX_HASH);
    expect(vm.displayHash).not.toBe(TX_HASH);
    expect(vm.displayHash.length).toBeLessThan(TX_HASH.length);
  });

  it('handles a completely empty receipt gracefully', () => {
    const vm = buildPaymentReceipt({});
    expect(vm.displayAmount).toBe(RECEIPT_PLACEHOLDER);
    expect(vm.displayDate).toBe(RECEIPT_PLACEHOLDER);
    expect(vm.displayDestination).toBe(RECEIPT_PLACEHOLDER);
    expect(vm.displayHash).toBe(RECEIPT_PLACEHOLDER);
    expect(vm.fullHash).toBeNull();
    expect(vm.destinationLabel).toBeNull();
    expect(vm.canCopyHash).toBe(false);
    expect(vm.hasExplorerLink).toBe(false);
    expect(vm.explorerUrl).toBeNull();
  });

  it('offers no explorer link when none is configured', () => {
    const vm = buildPaymentReceipt({ hash: TX_HASH, explorerUrl: null });
    expect(vm.canCopyHash).toBe(true);
    expect(vm.hasExplorerLink).toBe(false);
    expect(vm.explorerUrl).toBeNull();
  });
});