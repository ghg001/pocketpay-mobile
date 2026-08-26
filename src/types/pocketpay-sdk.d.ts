/**
 * Stub type declarations for pocketpay-sdk.
 * The real SDK is not currently available as a published package.
 * These stubs allow the project to type-check while the SDK is being developed.
 */
declare module 'pocketpay-sdk' {
  export function validatePublicKey(publicKey: string): boolean;
  export function importWallet(mnemonic: string): Promise<{ publicKey: string; secretKey: string }>;
}
