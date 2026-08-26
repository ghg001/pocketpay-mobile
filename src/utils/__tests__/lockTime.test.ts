import { formatTimeRemaining, getEligibilityText } from '../lockTime';

describe('formatTimeRemaining', () => {
  it('returns empty string for null/undefined input', () => {
    expect(formatTimeRemaining(null)).toBe('');
    expect(formatTimeRemaining(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatTimeRemaining('not-a-date')).toBe('');
  });

  it('returns "Ready to withdraw now" when the date is in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(formatTimeRemaining(past)).toBe('Ready to withdraw now');
  });

  it('returns days remaining for dates > 24h away', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString();
    const result = formatTimeRemaining(future);
    expect(result).toMatch(/About \d+ days remaining/);
  });

  it('returns "1 day" (singular) for dates ~1 day away', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString();
    const result = formatTimeRemaining(future);
    expect(result).toBe('About 1 day remaining');
  });

  it('returns hours remaining for dates > 1h but < 24h away', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString();
    const result = formatTimeRemaining(future);
    expect(result).toMatch(/About \d+ hours remaining/);
  });

  it('returns minutes remaining for dates < 1h away', () => {
    const future = new Date(Date.now() + 1000 * 60 * 15).toISOString();
    const result = formatTimeRemaining(future);
    expect(result).toMatch(/About \d+ minutes? remaining/);
  });
});

describe('getEligibilityText', () => {
  it('returns ready-to-withdraw text for matured locks', () => {
    const text = getEligibilityText('2024-01-01', 'matured');
    expect(text).toBe('These funds are ready to withdraw whenever you like.');
  });

  it('returns date + countdown text for locked items', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString();
    const text = getEligibilityText(future, 'locked');
    expect(text).toMatch(/You can withdraw on .+ About \d+ days remaining/);
  });

  it('handles invalid dates for locked items', () => {
    const text = getEligibilityText('garbage', 'locked');
    expect(text).toBe('Withdrawal is not yet available.');
  });
});
