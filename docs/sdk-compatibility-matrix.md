# SDK Compatibility Matrix

This document maps mobile app features to their SDK dependencies, method signatures, result types, error codes, and capability states. Use this matrix to understand which features are production-ready, which depend on experimental SDK functionality, and what integration risks exist.

## Overview

The PocketPay mobile app depends on multiple SDKs:
- **@stellar/stellar-sdk** (v16.0.1) - Core Stellar network interactions
- **pocketpay-sdk** (stub) - App-specific SDK (not yet published)
- **Expo packages** - React Native platform capabilities
- **Soroban contracts** - Smart contract interactions for vault features

---

## Wallet Features

### Keypair Generation
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk |
| **Method** | `StellarSdk.Keypair.fromRawEd25519Seed(seed)` |
| **Location** | `src/services/stellar.ts:generateKeypair()` |
| **Input** | `seed: Buffer` (32 bytes from expo-crypto) |
| **Output** | `{ publicKey: string, secretKey: string }` |
| **Dependencies** | `expo-crypto` (getRandomValues), `buffer` (Buffer) |
| **Status** | ✅ Production-ready |
| **Known Issues** | None |

### Account Loading
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Horizon) |
| **Method** | `server.loadAccount(publicKey)` |
| **Location** | `src/services/stellar.ts:fetchAccountDetails()` |
| **Input** | `publicKey: string` (G...) |
| **Output** | `AccountResponse` (balances, sequence number, etc.) |
| **Errors** | 404 → "Account not found on the network" |
| **Status** | ✅ Production-ready |
| **Known Issues** | Horizon 404 for unfunded accounts requires explicit handling |

### Balance Fetching
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Horizon) |
| **Method** | `server.loadAccount(publicKey)` → filter balances |
| **Location** | `src/services/stellar.ts:fetchXlmBalance()` |
| **Input** | `publicKey: string` |
| **Output** | `string` (XLM balance, "0.0000000" if unfunded) |
| **Dependencies** | fetchAccountDetails() |
| **Status** | ✅ Production-ready |
| **Known Issues** | Returns "0.0000000" for unfunded accounts (not an error) |

---

## Payment Features

### Transaction Submission
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Horizon) |
| **Method** | `server.submitTransaction(transaction)` |
| **Location** | `src/services/stellar.ts:sendXlmTransaction()` |
| **Input** | `secretKey: string, destinationPublicKey: string, amount: string, memoText?: string` |
| **Output** | `SubmitTransactionResponse` (hash, ledger, etc.) |
| **Operations** | `Operation.payment()` with `Asset.native()` |
| **Memo** | Optional `Memo.text(memoText)` |
| **Timeout** | 30 seconds |
| **Errors** | `ACCOUNT_NOT_FOUND`, `INSUFFICIENT_BALANCE`, network errors |
| **Status** | ✅ Production-ready |
| **Known Issues** | Error extraction from `error.response.data.extras.result_codes` can be fragile |

### Base Fee Fetching
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Horizon) |
| **Method** | `server.fetchBaseFee()` |
| **Location** | `src/services/stellar.ts:sendXlmTransaction()` |
| **Output** | `number` (stroops, typically 100) |
| **Status** | ✅ Production-ready |
| **Known Issues** | None |

---

## Transaction History

### Recent Transactions
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Horizon) |
| **Method** | `server.operations().forAccount(publicKey).order('desc').limit(limit).call()` |
| **Location** | `src/services/stellar.ts:fetchRecentTransactions()` |
| **Input** | `publicKey: string, limit: number = 20` |
| **Output** | `any[]` (operation records) |
| **Type** | `PaymentRecord` (exported from stellar.ts) |
| **Errors** | 404 → empty array (unfunded account) |
| **Status** | ✅ Production-ready |
| **Known Issues** | Returns `any[]` instead of typed array |

### Paginated Transactions
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Horizon) |
| **Method** | `server.operations().forAccount(publicKey).cursor(cursor).call()` |
| **Location** | `src/services/stellar.ts:fetchTransactionsPage()` |
| **Input** | `publicKey: string, limit: number = 20, cursor?: string` |
| **Output** | `TransactionsPage { records, nextCursor, hasMore }` |
| **Pagination** | Cursor-based using `paging_token` |
| **Status** | ✅ Production-ready |
| **Known Issues** | `paging_token` cast to `any` for cursor extraction |

---

## Testnet Funding

### Friendbot
| Aspect | Details |
|--------|---------|
| **SDK** | None (direct fetch) |
| **Method** | `fetch(https://friendbot.stellar.org?addr=${publicKey})` |
| **Location** | `src/services/stellar.ts:fundWithFriendbot()` |
| **Input** | `publicKey: string` |
| **Output** | `void` |
| **Network** | Testnet only (fails on mainnet) |
| **Status** | ✅ Production-ready (testnet) |
| **Known Issues** | No retry logic, network errors throw generic messages |

---

## Vault Features (Soroban)

### Vault Connection
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Soroban) or mock |
| **Method** | `connectVault(publicKey)` |
| **Location** | `src/services/vault.ts` or `src/services/stellar.ts:mockConnectVault()` |
| **Input** | `publicKey: string` |
| **Output** | `Promise<boolean>` |
| **Real Implementation** | Soroban contract invocation (requires `EXPO_PUBLIC_VAULT_CONTRACT_ID`) |
| **Mock Implementation** | Simulates 1s delay, returns `true` |
| **Status** | ⚠️ Experimental (real implementation depends on deployed Soroban contract) |
| **Known Issues** | Mock has no state persistence, real contract not yet deployed |
| **Integration Risk** | HIGH - contract interface may change, no production contract available |

### Vault Balance
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Soroban) or mock |
| **Method** | `fetchVaultBalance(publicKey)` |
| **Location** | `src/services/vault.ts` or `src/services/stellar.ts:mockFetchVaultBalance()` |
| **Input** | `publicKey: string` |
| **Output** | `Promise<string>` (balance in XLM) |
| **Mock Output** | Always returns "0.0000000" |
| **Status** | ⚠️ Experimental |
| **Known Issues** | Mock returns static value, real implementation requires contract read call |
| **Integration Risk** | HIGH - contract read calls may fail, no error handling spec |

### Vault Deposit
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Soroban) or mock |
| **Method** | `depositToVault(secretKey, amount)` |
| **Location** | `src/services/vault.ts` or `src/services/stellar.ts:mockDepositToVault()` |
| **Input** | `secretKey: string, amount: string` |
| **Output** | `Promise<boolean>` |
| **Mock Behavior** | Simulates 1.5s delay, returns `true` |
| **Status** | ⚠️ Experimental |
| **Known Issues** | Mock doesn't actually transfer tokens, no lock duration parameter |
| **Integration Risk** | HIGH - contract write calls require gas estimation, may fail |

### Vault Withdrawal
| Aspect | Details |
|--------|---------|
| **SDK** | @stellar/stellar-sdk (Soroban) or mock |
| **Method** | `withdrawFromVault(secretKey, amount)` |
| **Location** | `src/services/vault.ts` or `src/services/stellar.ts:mockWithdrawFromVault()` |
| **Input** | `secretKey: string, amount: string` |
| **Output** | `Promise<boolean>` |
| **Mock Behavior** | Simulates 1.5s delay, returns `true` |
| **Status** | ⚠️ Experimental |
| **Known Issues** | Mock doesn't check lock duration, no penalty calculation |
| **Integration Risk** | HIGH - contract may enforce lock periods, early withdrawal penalties |

---

## QR Code Features

### QR Generation
| Aspect | Details |
|--------|---------|
| **SDK** | react-native-qrcode-svg (v6.3.21) |
| **Method** | `<QRCode value={...} />` |
| **Location** | `src/components/QrCode.tsx` |
| **Input** | `value: string` (Stellar address or payment request) |
| **Output** | SVG QR code component |
| **Status** | ✅ Production-ready |
| **Known Issues** | None |

### QR Scanning
| Aspect | Details |
|--------|---------|
| **SDK** | expo-camera (~17.0.10) |
| **Method** | `<Camera onBarCodeScanned={...} />` |
| **Location** | `src/components/QrScanner.tsx` |
| **Input** | Camera permission + barcode scan callback |
| **Output** | `BarCodeScannedResult { type, data }` |
| **Permissions** | Requires camera permission (expo-camera) |
| **Status** | ✅ Production-ready |
| **Known Issues** | Permission handling required, no QR validation logic in component |

---

## Diagnostics & Error Reporting

### Diagnostics
| Aspect | Details |
|--------|---------|
| **SDK** | None (custom implementation) |
| **Method** | `captureDiagnostics(context, error)` |
| **Location** | `src/utils/diagnostics.ts` |
| **Input** | `context: string, error: Error` |
| **Output** | `void` (logs to console) |
| **Status** | ✅ Production-ready |
| **Known Issues** | No external logging service integration |

### Error Reporting
| Aspect | Details |
|--------|---------|
| **SDK** | None (custom implementation) |
| **Method** | `reportError(error, context)` |
| **Location** | `src/utils/errorReporting.ts` |
| **Input** | `error: Error, context?: Record<string, any>` |
| **Output** | `void` (console.error) |
| **Status** | ⚠️ Experimental |
| **Known Issues** | No integration with Sentry, Crashlytics, or other error tracking |
| **Integration Risk** | MEDIUM - should integrate external error tracking before production |

---

## PocketPay SDK (Stub)

### Public Key Validation
| Aspect | Details |
|--------|---------|
| **SDK** | pocketpay-sdk (stub) |
| **Method** | `validatePublicKey(publicKey: string): boolean` |
| **Location** | `src/types/pocketpay-sdk.d.ts` (type declaration only) |
| **Input** | `publicKey: string` |
| **Output** | `boolean` |
| **Status** | ❌ Not implemented (stub only) |
| **Known Issues** | No actual implementation, just TypeScript types |
| **Integration Risk** | HIGH - SDK not published, validation must be implemented locally or wait for SDK |

### Wallet Import
| Aspect | Details |
|--------|---------|
| **SDK** | pocketpay-sdk (stub) |
| **Method** | `importWallet(mnemonic: string): Promise<{ publicKey, secretKey }>` |
| **Location** | `src/types/pocketpay-sdk.d.ts` (type declaration only) |
| **Input** | `mnemonic: string` (BIP39 mnemonic phrase) |
| **Output** | `Promise<{ publicKey: string, secretKey: string }>` |
| **Status** | ❌ Not implemented (stub only) |
| **Known Issues** | No actual implementation, mnemonic parsing not available |
| **Integration Risk** | CRITICAL - wallet import feature blocked until SDK is published |

---

## Platform Dependencies

### Secure Storage
| Aspect | Details |
|--------|---------|
| **SDK** | expo-secure-store (~15.0.8) |
| **Method** | `SecureStore.setItemAsync()`, `getItemAsync()`, `deleteItemAsync()` |
| **Location** | `src/store/walletStore.ts` |
| **Input** | `key: string, value?: string` |
| **Output** | `Promise<string \| null>` |
| **Security** | Encrypted storage (Keychain on iOS, Keystore on Android) |
| **Status** | ✅ Production-ready |
| **Known Issues** | None |

### Local Authentication
| Aspect | Details |
|--------|---------|
| **SDK** | expo-local-authentication (~17.0.8) |
| **Method** | `LocalAuthentication.authenticateAsync()` |
| **Location** | `src/hooks/useBiometricAuth.ts` |
| **Input** | `promptMessage: string` |
| **Output** | `AuthenticationResult { success, error? }` |
| **Capabilities** | Face ID, Touch ID, PIN, pattern |
| **Status** | ✅ Production-ready |
| **Known Issues** | Requires hardware support, fallback to PIN required |

### Clipboard
| Aspect | Details |
|--------|---------|
| **SDK** | expo-clipboard (~8.0.8) |
| **Method** | `Clipboard.setString()`, `getStringAsync()` |
| **Location** | `src/components/CopyButton.tsx` |
| **Input** | `text: string` |
| **Output** | `void` or `Promise<string>` |
| **Status** | ✅ Production-ready |
| **Known Issues** | None |

---

## Unsupported / Experimental Behaviors

### Not Yet Implemented
- **Multi-asset support**: Only XLM (native asset) supported. Custom assets require additional SDK methods.
- **Path payments**: Not implemented. Requires `Operation.pathPaymentStrictSend()` or `pathPaymentStrictReceive()`.
- **Trustlines**: Not implemented. Requires `Operation.changeTrust()` for custom assets.
- **Data entries**: Not implemented. Requires `Operation.manageData()` for account metadata.
- **Offers**: Not implemented. Requires `Operation.manageBuyOffer()` or `manageSellOffer()` for DEX.

### Experimental (Use with Caution)
- **Soroban vault features**: All vault operations use mock implementations. Real Soroban contract not deployed.
- **PocketPay SDK**: Entire SDK is a stub. No published package available.
- **Biometric authentication**: Implemented but not required. Should be optional with PIN fallback.
- **Error tracking**: Basic console logging only. No production error monitoring.

### Known Integration Risks

1. **Soroban Contract Deployment**
   - Risk: HIGH
   - Impact: Vault features completely blocked
   - Mitigation: Deploy contract to testnet, document interface, add integration tests

2. **PocketPay SDK Publication**
   - Risk: CRITICAL
   - Impact: Wallet import feature blocked
   - Mitigation: Implement BIP39 mnemonic parsing locally or wait for SDK

3. **Error Tracking Integration**
   - Risk: MEDIUM
   - Impact: Production debugging difficult
   - Mitigation: Integrate Sentry or similar before mainnet launch

4. **Horizon API Changes**
   - Risk: LOW
   - Impact: Transaction submission or account loading may break
   - Mitigation: Pin SDK version, monitor Stellar changelog

5. **Testnet vs Mainnet**
   - Risk: HIGH
   - Impact: Friendbot, network URLs, and contract IDs differ
   - Mitigation: Environment-based configuration, test on both networks

---

## Environment Variables

Required environment variables for SDK functionality:

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `EXPO_PUBLIC_STELLAR_HORIZON_URL` | Horizon API endpoint | `https://horizon-testnet.stellar.org` | Yes |
| `EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Network passphrase | `Test SDF Network ; September 2015` | Yes |
| `EXPO_PUBLIC_STELLAR_NETWORK` | Network name (TESTNET/PUBLIC) | `TESTNET` | No (defaults to TESTNET) |
| `EXPO_PUBLIC_VAULT_CONTRACT_ID` | Soroban vault contract ID | `CA...` | No (uses mock if missing) |

---

## Recommendations

### Before Production Launch
1. Deploy Soroban vault contract to testnet and validate all operations
2. Publish pocketpay-sdk or implement BIP39 locally
3. Integrate Sentry or Crashlytics for error tracking
4. Add integration tests for all Horizon API calls
5. Test on mainnet with small amounts
6. Document all error codes and user-facing messages

### Future Enhancements
1. Multi-asset support (custom tokens)
2. Path payments for better exchange rates
3. DEX integration (offers, orderbook)
4. Federation address support (name*domain.com)
5. SEP-0010 authentication for web3 integrations
6. SEP-0011 compliance for transaction signing

---

## Version Information

- **@stellar/stellar-sdk**: 16.0.1
- **pocketpay-sdk**: stub (not published)
- **expo**: ~54.0.33
- **react-native**: 0.81.5
- **App version**: 1.0.0

Last updated: 2026-01-27
