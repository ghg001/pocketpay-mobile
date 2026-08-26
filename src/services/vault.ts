import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Soroban Savings Vault service.
 *
 * Assumed contract interface (coordinate with the deployed contract):
 *   deposit(from: Address, amount: i128)
 *   withdraw(to: Address, amount: i128)
 *   balance(id: Address) -> i128
 *
 * Amounts are i128 stroops (1 XLM = 10,000,000 stroops).
 * When EXPO_PUBLIC_VAULT_CONTRACT_ID is not set, the vault screen falls back
 * to the mock helpers in stellar.ts and no real funds are moved.
 *
 * For integration risks, assumptions, and coordination notes,
 * see docs/vault-integration-risks.md.
 */

const SOROBAN_RPC_URL =
  process.env.EXPO_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

const VAULT_CONTRACT_ID = (process.env.EXPO_PUBLIC_VAULT_CONTRACT_ID || '').trim();

const NETWORK_PASSPHRASE =
  process.env.EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;

const STROOPS_PER_XLM = 10_000_000n;

export const isVaultConfigured = (): boolean => VAULT_CONTRACT_ID.length > 0;

export const getVaultContractId = (): string => VAULT_CONTRACT_ID;

const getServer = () => new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

const getContract = () => {
  if (!isVaultConfigured()) {
    throw new Error(
      'No vault contract configured. Set EXPO_PUBLIC_VAULT_CONTRACT_ID in your .env file.'
    );
  }
  return new StellarSdk.Contract(VAULT_CONTRACT_ID);
};

/** Convert a decimal XLM string (e.g. "12.5") to i128 stroops without float precision loss. */
export const xlmToStroops = (amount: string): bigint => {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('Invalid amount');
  }
  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > 7) {
    throw new Error('XLM supports at most 7 decimal places');
  }
  const paddedFraction = fraction.padEnd(7, '0');
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(paddedFraction || '0');
};

/** Convert stroops back to a 7-decimal XLM string. */
export const stroopsToXlm = (stroops: bigint): string => {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  const whole = abs / STROOPS_PER_XLM;
  const fraction = (abs % STROOPS_PER_XLM).toString().padStart(7, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
};

const friendlyError = (error: any, fallback: string): Error => {
  const message: string = error?.message || String(error);
  if (message.includes('Account not found') || message.includes('404')) {
    return new Error('Account not found on the network. Please fund it first.');
  }
  if (message.includes('Network request failed')) {
    return new Error('Network error. Check your connection and the Soroban RPC URL.');
  }
  return new Error(message || fallback);
};

/**
 * Read the vault balance for an account by simulating the `balance` call.
 * Simulation is free — no transaction is submitted and no signature is needed.
 */
export const getVaultBalance = async (publicKey: string): Promise<string> => {
  const server = getServer();
  const contract = getContract();

  try {
    const account = await server.getAccount(publicKey);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('balance', new StellarSdk.Address(publicKey).toScVal()))
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);

    if (!StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
      const detail = 'error' in simulation ? simulation.error : 'simulation failed';
      throw new Error(`Could not read vault balance: ${detail}`);
    }

    const retval = simulation.result?.retval;
    const raw = retval !== undefined ? StellarSdk.scValToNative(retval) : 0n;
    return stroopsToXlm(BigInt(raw ?? 0));
  } catch (error: any) {
    throw friendlyError(error, 'Failed to load vault balance');
  }
};

/**
 * Build, simulate, sign, submit, and confirm a vault contract invocation.
 */
const invokeVault = async (
  secretKey: string,
  method: 'deposit' | 'withdraw',
  amountXlm: string
): Promise<string> => {
  const server = getServer();
  const contract = getContract();

  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const publicKey = keypair.publicKey();
  const stroops = xlmToStroops(amountXlm);
  if (stroops <= 0n) {
    throw new Error('Amount must be greater than zero');
  }

  try {
    const account = await server.getAccount(publicKey);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          method,
          new StellarSdk.Address(publicKey).toScVal(),
          StellarSdk.nativeToScVal(stroops, { type: 'i128' })
        )
      )
      .setTimeout(60)
      .build();

    // prepareTransaction simulates the call and attaches the Soroban
    // footprint, resource fees, and auth entries the contract requires.
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(keypair);

    const sendResponse = await server.sendTransaction(prepared);
    if (sendResponse.status === 'ERROR') {
      throw new Error(
        `Transaction rejected: ${sendResponse.errorResult?.result()?.switch()?.name || 'unknown error'}`
      );
    }

    const confirmation = await server.getTransaction(sendResponse.hash);
    if (confirmation.status !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error(`Vault ${method} failed on-chain (status: ${confirmation.status})`);
    }

    return sendResponse.hash;
  } catch (error: any) {
    throw friendlyError(error, `Vault ${method} failed`);
  }
};

/** Deposit XLM into the vault contract. Returns the transaction hash. */
export const depositToVault = (secretKey: string, amountXlm: string): Promise<string> =>
  invokeVault(secretKey, 'deposit', amountXlm);

/** Withdraw XLM from the vault contract. Returns the transaction hash. */
export const withdrawFromVault = (secretKey: string, amountXlm: string): Promise<string> =>
  invokeVault(secretKey, 'withdraw', amountXlm);
