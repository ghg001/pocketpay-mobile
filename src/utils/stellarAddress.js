function validateDestinationAddress(value) {
  if (typeof value !== 'string') {
    return { isValid: false, error: 'Enter a valid Stellar public key.' };
  }

  const normalized = value.trim();
  if (!normalized) {
    return { isValid: true };
  }

  const isValid = normalized.length === 56 && normalized.startsWith('G') && /^[A-Z2-7]+$/.test(normalized);
  return isValid
    ? { isValid: true }
    : { isValid: false, error: 'Enter a valid Stellar public key.' };
}

module.exports = {
  validateDestinationAddress,
};
