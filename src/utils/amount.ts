/**
 * Minimum XLM reserve that must stay in the wallet.
 * Accounts must keep this balance to remain active on the network.
 */
export const MIN_XLM_RESERVE = 1;

/**
 * Calculate the maximum amount that can be sent from a wallet,
 * accounting for the minimum XLM reserve requirement.
 *
 * @param balance The current wallet balance as a string or number
 * @param reserve Optional reserve override (defaults to MIN_XLM_RESERVE)
 * @returns The max sendable amount as a string, or '0' if balance is insufficient
 */
export function getMaxSendableAmount(
  balance: string | number | null | undefined,
  reserve: number = MIN_XLM_RESERVE,
): string {
  if (balance === null || balance === undefined || balance === '') {
    return '0';
  }

  const num = typeof balance === 'number' ? balance : parseFloat(balance);
  if (isNaN(num) || num <= 0) {
    return '0';
  }

  const maxSendable = Math.max(0, num - reserve);
  // Return with up to 7 decimal places, stripping trailing zeros
  return maxSendable.toFixed(7).replace(/\.?0+$/, '');
}

/**
 * Formats a numeric amount for display.
 * Standardises displaying XLM and other asset amounts.
 *
 * @param amount The numeric amount as a string, number, or null/undefined
 * @param options Optional formatting settings
 * @returns The formatted amount string
 */
export function formatAmount(
  amount: string | number | null | undefined,
  options: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  } = {}
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  let amountStr = typeof amount === 'number' ? amount.toFixed(7) : amount.trim();
  if (amountStr.includes('e') || amountStr.includes('E')) {
    const parsedNum = parseFloat(amountStr);
    if (!isNaN(parsedNum)) {
      amountStr = parsedNum.toFixed(7);
    }
  }
  const num = parseFloat(amountStr);
  if (isNaN(num)) {
    return '—';
  }

  const isNegative = amountStr.startsWith('-');
  const absoluteAmountStr = isNegative ? amountStr.slice(1) : amountStr;
  
  const parts = absoluteAmountStr.split('.');
  const integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '';

  // Trim trailing zeros from the decimal part
  decimalPart = decimalPart.replace(/0+$/, '');

  const {
    maximumFractionDigits = 7,
    minimumFractionDigits = 0,
  } = options;

  // Enforce decimal limit
  if (decimalPart.length > maximumFractionDigits) {
    decimalPart = decimalPart.slice(0, maximumFractionDigits);
  }

  // Pad to match minimumFractionDigits if needed
  if (decimalPart.length < minimumFractionDigits) {
    decimalPart = decimalPart.padEnd(minimumFractionDigits, '0');
  }

  // Format integer part with commas
  const formattedInt = Number(integerPart).toLocaleString('en-US');

  const formattedAbs = decimalPart.length > 0 ? `${formattedInt}.${decimalPart}` : formattedInt;
  return isNegative ? `-${formattedAbs}` : formattedAbs;
}
