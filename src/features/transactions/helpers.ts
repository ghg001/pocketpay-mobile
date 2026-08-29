/**
 * Transaction feature helper utilities
 */

import { TransactionDetail, TransactionStatus } from './types';
import { formatAmount } from '../../utils/amount';

/**
 * Determines the status of a transaction
 */
export function getTransactionStatus(tx: TransactionDetail): TransactionStatus {
  if (tx.is_pending === true) return 'pending';
  if (tx.transaction_successful === false) return 'failed';
  return 'successful';
}

/**
 * Checks if a transaction was sent by the current user
 */
export function isSentTransaction(
  tx: TransactionDetail,
  currentPublicKey: string | null
): boolean {
  if (!currentPublicKey) return false;
  return tx.from === currentPublicKey;
}

/**
 * Gets the counterparty address for a transaction
 *(recipient for sent transactions, sender for received)
 */
export function getCounterpartyAddress(
  tx: TransactionDetail,
  currentPublicKey: string | null
): string | null {
  if (!currentPublicKey) return null;
  
  const isSent = isSentTransaction(tx, currentPublicKey);
  return isSent ? (tx.to || null) : (tx.from || null);
}

/**
 * Formats a transaction amount with direction prefix
 */
export function formatTransactionAmount(
  tx: TransactionDetail,
  currentPublicKey: string | null
): string {
  const isSent = isSentTransaction(tx, currentPublicKey);
  const amount = tx.amount ? formatAmount(tx.amount) : 'N/A';
  const prefix = isSent ? '-' : '+';
  const asset = tx.asset || 'XLM';
  
  return `${prefix}${amount} ${asset}`;
}

/**
 * Formats a transaction date/timestamp
 */
export function formatTransactionDate(tx: TransactionDetail): string {
  const dateValue = tx.created_at || tx.createdAt || tx.timestamp;
  
  if (!dateValue) return 'Unknown date';
  
  try {
    return new Date(dateValue).toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

/**
 * Gets the transaction hash from various possible fields
 */
export function getTransactionHash(tx: TransactionDetail): string {
  return tx.hash || tx.transaction_hash || '';
}

/**
 * Gets the memo text and type from transaction
 */
export function getTransactionMemo(tx: TransactionDetail): {
  text: string;
  type: string;
} | null {
  if (!tx.memo) return null;
  
  return {
    text: tx.memo,
    type: tx.memo_type || '',
  };
}

/**
 * Checks if transaction data is safe to display (handles missing fields)
 */
export function validateTransactionData(tx: TransactionDetail): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields : string[] = [];
  
  if (!tx.id) missingFields.push('id');
  if (!tx.amount && tx.amount !== '0') missingFields.push('amount');
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Safely gets a transaction direction label
 */
export function getDirectionLabel(
  tx: TransactionDetail,
  currentPublicKey: string | null
): string {
  const isSent = isSentTransaction(tx, currentPublicKey);
  return isSent ? 'Sent' : 'Received';
}

/**
 * Base URL for the Stellar Testnet explorer.
 */
const TESTNET_EXPLORER_URL = 'https://testnet.stellar.expert/explorer/testnet/tx/';

/**
 * Checks if a transaction hash is valid (64-character hex string)
 */
export function isValidTransactionHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Returns the Stellar Testnet explorer URL for a transaction, or null if invalid.
 */
export function getTransactionExplorerUrl(tx: TransactionDetail): string | null {
  const hash = getTransactionHash(tx);
  if (!isValidTransactionHash(hash)) return null;
  return `${TESTNET_EXPLORER_URL}${hash}`;
}
