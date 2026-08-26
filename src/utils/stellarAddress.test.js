// src/utils/stellarAddress.test.js
const assert = require('node:assert/strict');
const { validateDestinationAddress } = require('./stellarAddress');

describe('stellarAddress utils', () => {
  it('validates Stellar public keys and returns a clear error for invalid values', () => {
    expect(validateDestinationAddress('GBAJ4V3Q...').error).toBe('Enter a valid Stellar public key.');
    expect(validateDestinationAddress('G' + 'A'.repeat(55)).error).toBeUndefined();
    expect(validateDestinationAddress('').error).toBeUndefined();
  });
});