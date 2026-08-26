# Screen Inventory

This document provides a quick map of the main screens and routes in the Stellar PocketPay app. The app uses Expo Router for navigation.

## `app/(tabs)/index.tsx` (Main Wallet)
*   **Route Name:** `/(tabs)/` (or Home)
*   **Purpose:** Displays the total balance, public key, and recent activity preview. Serves as the main dashboard.
*   **Key Components:** `Button`, `ScrollView`, `RefreshControl`
*   **State Dependencies:** `useWalletStore` (publicKey, balance, transactions, isLoading, refreshWalletData)
*   **Related SDK Calls:** N/A (Data fetched via store)

## `app/send.tsx`
*   **Route Name:** `/send`
*   **Purpose:** Allows the user to enter payment details (destination, amount, memo) and navigate to the transaction review screen.
*   **Key Components:** `FormField`, `Button`, `KeyboardAvoidingView`, `QrScanner`
*   **State Dependencies:** `useWalletStore` (publicKey, balance)
*   **Related SDK Calls:** N/A (validation only; signing happens in review screen)

## `app/review-transaction.tsx`
*   **Route Name:** `/review-transaction`
*   **Purpose:** Full-screen transaction review before signing. Displays transaction details, signer info, and handles the signing handoff lifecycle (review → signing → submitting → completed/failed).
*   **Key Components:** `ScreenHeader`, `Button`
*   **State Dependencies:** `useWalletStore` (publicKey, getSecretKey, refreshWalletData), `useSignerStore` (phase, review, result, error), `useAppStore` (contacts for label resolution)
*   **Related SDK Calls:** `sendXlmTransaction` (from `src/services/stellar`)
*   **Design:** Part of the signer handoff architecture for future external wallet support. See `docs/signer-handoff-design.md`.

## `app/receive.tsx`
*   **Route Name:** `/receive`
*   **Purpose:** Displays the user's public key and QR code to receive payments.
*   **Key Components:** `QRCode` (react-native-qrcode-svg), `Button`
*   **State Dependencies:** `useWalletStore` (publicKey)
*   **Related SDK Calls:** N/A

## `app/(tabs)/history.tsx` (Activity)
*   **Route Name:** `/(tabs)/history`
*   **Purpose:** Lists all recent transactions (sent and received) for the current wallet.
*   **Key Components:** `FlatList`, `RefreshControl`
*   **State Dependencies:** `useWalletStore` (transactions, isLoading, refreshWalletData, publicKey)
*   **Related SDK Calls:** N/A (Data fetched via store)

## `app/contacts.tsx`
*   **Route Name:** `/contacts`
*   **Purpose:** Manages the address book. Allows adding and removing contacts (names and public keys).
*   **Key Components:** `FlatList`, `Input`, `Button`
*   **State Dependencies:** `useAppStore` (contacts, addContact, removeContact)
*   **Related SDK Calls:** N/A

## `app/(tabs)/vault.tsx`
*   **Route Name:** `/(tabs)/vault`
*   **Purpose:** Soroban Savings Vault UI. Shows vault balance, deposit/withdraw form, and a multi-lock list of time-locked positions.
*   **Key Components:** `Input`, `Button`, `MultiLockList`
*   **State Dependencies:** `useWalletStore` (publicKey, getSecretKey), `useVaultStore` (balance, isConfigured, contractId, loadBalance, deposit, withdraw)
*   **Related SDK Calls:** `mockFetchVaultBalance`, `mockDepositToVault`, `mockWithdrawFromVault` (from `src/services/stellar`)
*   **Placeholder Data:** Lock fixtures from `tests/fixtures/vault.ts` simulate three lock statuses (locked, matured, withdrawn). See `docs/multi-lock.md` for integration roadmap.
