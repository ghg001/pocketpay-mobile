/**
 * Stellar address normalization and duplicate-detection utilities.
 *
 * All comparisons are case-insensitive and whitespace-insensitive so that
 * "gabc...", "GABC...", and " GABC... " are treated as the same address.
 */

/**
 * Normalize a Stellar public key for consistent comparison.
 * Trims whitespace and converts to uppercase.
 */
export const normalizeAddress = (publicKey: string): string =>
  publicKey.trim().toUpperCase();

/**
 * Check whether two addresses represent the same Stellar public key.
 */
export const isSameAddress = (a: string, b: string): boolean =>
  normalizeAddress(a) === normalizeAddress(b);

export interface AddressBookEntry {
  id: string;
  name: string;
  publicKey: string;
}

/**
 * Find a contact in the address book whose public key matches `candidate`
 * (normalized comparison). Returns the first match, or `undefined` if no match.
 */
export const findDuplicate = (
  candidate: string,
  entries: ReadonlyArray<AddressBookEntry>,
): AddressBookEntry | undefined => {
  const normalized = normalizeAddress(candidate);
  return entries.find((entry) => normalizeAddress(entry.publicKey) === normalized);
};

/**
 * Check whether adding `candidate` to `entries` would create a duplicate.
 */
export const isDuplicate = (
  candidate: string,
  entries: ReadonlyArray<AddressBookEntry>,
): boolean => findDuplicate(candidate, entries) !== undefined;

/**
 * Build a human-readable duplicate error message referencing the existing entry.
 */
export const duplicateMessage = (existingName: string): string =>
  `This address is already saved as "${existingName || 'Unnamed'}". ` +
  'You can update the existing entry instead of creating a duplicate.';
