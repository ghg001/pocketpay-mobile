const StellarSdk = require('@stellar/stellar-sdk');

function validatePublicKey(key) {
  try {
    StellarSdk.Keypair.fromPublicKey(key);
  } catch (e) {
    throw new Error('Invalid Stellar public key');
  }
}

function importWallet(secretKey) {
  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    return { publicKey: keypair.publicKey() };
  } catch (e) {
    throw new Error('Invalid Stellar secret key');
  }
}

module.exports = { validatePublicKey, importWallet };
