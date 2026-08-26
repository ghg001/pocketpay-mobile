// Jest mock for pocketpay-sdk
export const validatePublicKey = jest.fn((publicKey: string) => {
  // Basic Stellar public key validation: starts with G, 56 chars
  if (typeof publicKey !== 'string' || !publicKey.startsWith('G') || publicKey.length !== 56) {
    throw new Error('Invalid Stellar public key');
  }
  return true;
});

export const importWallet = jest.fn(async (secretKey: string) => {
  return {
    publicKey: 'GAMOCKMOCKMOCKMOCKMOCKMOCKMOCKMOCKMOCKMOCKMOCKMOCK',
    secretKey,
  };
});
