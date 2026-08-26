/**
 * lockTime utilities
 *
 * Human-readable helpers for vault lock timing.
 * All output uses plain language — no blockchain jargon.
 */

/**
 * Convert a date string to a human-readable countdown.
 *
 * Examples:
 *  - "About 29 days remaining"
 *  - "About 3 hours remaining"
 *  - "Ready to withdraw now"
 *  - "" (if the input can't be parsed)
 */
export function formatTimeRemaining(unlockDateStr: string | null | undefined): string {
  if (!unlockDateStr) return '';

  const unlockDate = new Date(unlockDateStr);
  if (isNaN(unlockDate.getTime())) return '';

  const now = Date.now();
  const diff = unlockDate.getTime() - now;

  if (diff <= 0) return 'Ready to withdraw now';

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days >= 1) {
    return `About ${days} ${days === 1 ? 'day' : 'days'} remaining`;
  }
  if (hours >= 1) {
    return `About ${hours} ${hours === 1 ? 'hour' : 'hours'} remaining`;
  }
  return `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} remaining`;
}

/**
 * Build a short withdrawal-eligibility sentence for a single lock.
 *
 * @param unlockDateISO  ISO-8601 date string (e.g. from Lock.unlockDate)
 * @param status         'locked' | 'matured'
 * @returns Plain-language eligibility string
 */
export function getEligibilityText(
  unlockDateISO: string,
  status: 'locked' | 'matured',
): string {
  if (status === 'matured') {
    return 'These funds are ready to withdraw whenever you like.';
  }

  const unlockDate = new Date(unlockDateISO);
  if (isNaN(unlockDate.getTime())) {
    return 'Withdrawal is not yet available.';
  }

  const remaining = formatTimeRemaining(unlockDateISO);
  const dateStr = unlockDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `You can withdraw on ${dateStr}. ${remaining}`.trim();
}
