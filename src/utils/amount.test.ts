import { formatAmount, getMaxSendableAmount } from './amount';

describe('getMaxSendableAmount', () => {
  it('returns 0 for null/undefined/empty balance', () => {
    expect(getMaxSendableAmount(null)).toBe('0');
    expect(getMaxSendableAmount(undefined)).toBe('0');
    expect(getMaxSendableAmount('')).toBe('0');
  });

  it('returns 0 for zero or negative balance', () => {
    expect(getMaxSendableAmount('0')).toBe('0');
    expect(getMaxSendableAmount('-10')).toBe('0');
  });

  it('subtracts the default MIN_XLM_RESERVE (1) from the balance', () => {
    expect(getMaxSendableAmount('100')).toBe('99');
    expect(getMaxSendableAmount('1.5')).toBe('0.5');
    expect(getMaxSendableAmount('1')).toBe('0');
  });

  it('returns 0 when balance is less than reserve', () => {
    expect(getMaxSendableAmount('0.5')).toBe('0');
    expect(getMaxSendableAmount('0.0000001')).toBe('0');
  });

  it('accepts a custom reserve parameter', () => {
    expect(getMaxSendableAmount('100', 2)).toBe('98');
    expect(getMaxSendableAmount('1', 0.5)).toBe('0.5');
  });

  it('handles number inputs', () => {
    expect(getMaxSendableAmount(100)).toBe('99');
    expect(getMaxSendableAmount(0.5)).toBe('0');
  });
});

describe('formatAmount', () => {
  it('formats integers correctly', () => {
    expect(formatAmount(50)).toBe('50');
    expect(formatAmount('50')).toBe('50');
    expect(formatAmount(1000)).toBe('1,000');
    expect(formatAmount('1000000')).toBe('1,000,000');
  });

  it('formats floats correctly and trims trailing zeros', () => {
    expect(formatAmount(50.12)).toBe('50.12');
    expect(formatAmount('50.1200000')).toBe('50.12');
    expect(formatAmount('0.0000001')).toBe('0.0000001');
    expect(formatAmount(0.0000001)).toBe('0.0000001');
  });

  it('handles negative values correctly', () => {
    expect(formatAmount(-50)).toBe('-50');
    expect(formatAmount('-50.120')).toBe('-50.12');
    expect(formatAmount('-0.05')).toBe('-0.05');
  });

  it('respects maximumFractionDigits options', () => {
    expect(formatAmount(50.12345678, { maximumFractionDigits: 4 })).toBe('50.1234');
    expect(formatAmount('50.1200000', { maximumFractionDigits: 2 })).toBe('50.12');
  });

  it('respects minimumFractionDigits options', () => {
    expect(formatAmount(50, { minimumFractionDigits: 2 })).toBe('50.00');
    expect(formatAmount(50.1, { minimumFractionDigits: 3 })).toBe('50.100');
  });

  it('handles empty, null, undefined, or invalid inputs gracefully', () => {
    expect(formatAmount(null)).toBe('—');
    expect(formatAmount(undefined)).toBe('—');
    expect(formatAmount('')).toBe('—');
    expect(formatAmount('abc')).toBe('—');
  });
});
