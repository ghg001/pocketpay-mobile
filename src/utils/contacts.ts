import { Contact, normalizePublicKey } from '../store/appStore';

/**
 * Truncates a Stellar public key for display, e.g. "GABC...WXYZ".
 * Falls back to the original string if it's too short to usefully truncate.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export interface AddressLabel {
  /** Contact name if known, otherwise a truncated address. Safe to render as the primary label. */
  label: string;
  /** True if this address matched a saved contact. */
  isContact: boolean;
  /** Always the truncated address, regardless of contact match — for secondary/subtitle display. */
  truncated: string;
}

/**
 * Resolves a public key against the saved contacts list, returning a
 * display-ready label. Never hides the underlying address: callers should
 * still render the full public key wherever it's currently shown (e.g.
 * confirmation and transaction detail flows) alongside this label.
 */
export function resolveAddressLabel(
  address: string | undefined | null,
  contacts: Contact[]
): AddressLabel {
  if (!address) {
    return { label: 'Unknown', isContact: false, truncated: '' };
  }

  const truncated = truncateAddress(address);
  const normalized = normalizePublicKey(address);
  const contact = contacts.find((c) => normalizePublicKey(c.publicKey) === normalized);

  return {
    label: contact ? contact.name : truncated,
    isContact: !!contact,
    truncated,
  };
}