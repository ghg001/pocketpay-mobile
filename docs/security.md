# Security Guide

This document covers how PocketPay handles keys and data, what the Testnet means for your funds, and how to keep your wallet safe.

---

## Testnet Only

PocketPay connects to the **Stellar Testnet**. Testnet XLM has no real-world monetary value — it exists solely for development and testing purposes.

- Do not send real funds to a Testnet address.
- Testnet accounts and balances can be reset by the Stellar Development Foundation at any time.
- When a Mainnet integration is added in the future, it will be clearly labelled and a separate security review will be conducted.

---

## Your Secret Key

Your Stellar secret key (starting with `S…`) is the only credential that controls your wallet. Anyone who has it can move your funds without any further authentication.

**Keep it private:**
- Never share your secret key with anyone — not developers, not support staff, not this app's maintainers.
- Never paste it into a chat, email, issue tracker, or form outside the app.
- Never commit it to source control, even in a private repository.
- If you believe your secret key has been exposed, generate a new keypair immediately and stop using the compromised one.

---

## How Keys Are Stored on Your Device

PocketPay stores your secret key using [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/), which maps to:

| Platform | Underlying storage |
|---|---|
| iOS | Keychain Services |
| Android | Android Keystore / EncryptedSharedPreferences |

The key is never written to plain `AsyncStorage`, logs, or the filesystem. It is only read at the moment a transaction needs to be signed, and the derived public key is used for everything else.

**What this means in practice:**
- The key is encrypted at rest using hardware-backed storage where available.
- It does not leave the device over the network (signing happens locally).
- Uninstalling the app removes the stored key. Make sure you have a backup before uninstalling.

---

## Backing Up Your Secret Key

There is no cloud backup or recovery phrase in this version of PocketPay. If you lose access to your device without a backup, **your wallet cannot be recovered**.

---

## App Lock (Biometric / Device Auth)

PocketPay includes an optional app-level lock that uses [`expo-local-authentication`](https://docs.expo.dev/versions/latest/sdk/local-authentication/) to require biometric or device passcode authentication before wallet screens become accessible.

**Behaviour:**
- **Enable**: Toggle "App Lock" in Settings → Preferences. You'll be prompted to authenticate once to confirm.
- **On launch / resume**: If lock is enabled, the app shows a lock screen. You must authenticate (Face ID, fingerprint, or device PIN) to proceed.
- **Disable**: Toggle off in Settings. A confirmation dialog appears before disabling.
- **Fallback**: If the device lacks biometric hardware or enrollment, the lock falls back to the device passcode / pattern.
- **After 5 failed attempts**: The OS enforces its own lockout policy (e.g., requiring device passcode on iOS).

The app lock protects *screen access only* — it is a UX-layer security measure on top of the keychain-backed secret key storage. For a detailed architectural specification of lock triggers, rate limiting, and future storage assumptions, see the [App Lock Model Design Note](app-lock-model.md).

Recommended backup steps:
1. After creating a wallet, write your secret key down on paper and store it somewhere physically secure (e.g. a safe).
2. Do not store it in a notes app, cloud drive, or screenshot unless it is encrypted with a strong password.
3. Verify the backup by importing it into the app before relying on it.

---

## Logging and Debugging

When building or modifying the app:

- Do not log secret keys, even temporarily. Use `console.log(keypair.publicKey())` rather than `console.log(keypair.secret())`.
- Be careful with error objects from the Stellar SDK — in some cases they may echo back request parameters. Review what you log before shipping.
- Remove or gate all debug logging behind `__DEV__` before a production build.

Example of what **not** to do:

```ts
// ❌ Never log the secret key
console.log('keypair:', keypair.secret());

// ✅ Log only the public key
console.log('public key:', keypair.publicKey());
```

---

## Screen Capture and Clipboard

- The app currently does not disable screenshots or screen recording. Avoid displaying your secret key on screen in a public place.
- When copying your public key via the share/copy feature, be aware that clipboard contents can be read by other apps on some Android versions.

---

## Signer Handoff Design

PocketPay uses a signer abstraction layer to separate transaction construction from signing. This design ensures that:

- **Secret keys never leave SecureStore.** The `Signer` interface receives a transaction builder callback, not the secret key. Each signer implementation is responsible for obtaining signing material through its own secure channel.
- **External signers are future-safe.** The architecture supports adding external wallet apps (via deep-link) or hardware wallets (via BLE/USB) without modifying the core payment flow. The `Signer` interface is designed for this extension.
- **No private key is exposed to the network.** Signing always happens either on-device (local signer) or within a separate secure application (external signer). The secret key is never transmitted, logged, or stored outside the platform-encrypted SecureStore.

See [signer-handoff-design.md](./signer-handoff-design.md) for the full architecture and type reference.

---

## Reporting a Security Issue

If you discover a security vulnerability, please do **not** open a public GitHub issue. Instead, contact the maintainers directly via the email listed in the repository profile. We aim to respond within 72 hours.

---

## Secure Storage Failures & Recovery

Due to OS-level sandboxing, device hardware restrictions, or biometric settings, the underlying secure storage (`expo-secure-store`) may occasionally throw errors when reading or writing your wallet's secret key.

### Common Causes of Inaccessible Storage
- **Device Lock State:** Reading the key fails immediately if the device is locked (especially after a reboot) because the OS denies keychain/keystore access until the passcode is entered.
- **Biometric Authentication Changes:** Registering new biometrics or turning off the screen lock can invalidate cryptographic keys generated by the hardware enclave.
- **Missing Permissions:** The app might lack necessary local authentication or background secure store access permissions.

### Graceful Recovery Flows
1. **No Autodelete on Read Failures:** If PocketPay encounters an error reading your secret key from storage, it **will not** delete or reset the key. The data remains intact, preventing permanent loss.
2. **Troubleshooting Steps:**
   - Unlock the device and restart the app.
   - Verify that your device has screen lock/passcode or biometrics active.
   - Grant the app any requested permissions.
3. **Hard Reset / Restore:** If secure storage is permanently corrupted, the app provides a secure reset flow in the Error Screen. **WARNING:** Resetting the database will delete your key locally. Ensure you have your secret key written down offline to restore your wallet afterwards.

---

## Summary Checklist

| Topic | Guidance |
|---|---|
| Testnet funds | No real value — safe to experiment |
| Secret key sharing | Never share with anyone |
| Device storage | Encrypted via `expo-secure-store` |
| Backup | Write it down offline; no cloud recovery |
| Logging | Never log the secret key |
| Lost device | Without a backup, the wallet cannot be recovered |
