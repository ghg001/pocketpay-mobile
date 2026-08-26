# App Lock Model Design Note

> ⚠️ **Status Note:** This document specifies the target design and architectural model for future App Lock mechanisms in PocketPay Mobile. It outlines design goals, lock triggers, biometric/PIN unlock strategies, security boundaries, and failed attempt policies. It does **not** imply that all advanced features (such as hardware-enforced biometric key wrapping or custom PIN vaults) are fully implemented in current production releases.

---

## 1. Overview & Threat Model

PocketPay Mobile is a non-custodial Stellar wallet. The App Lock model provides a UX-level and cryptographic security barrier designed to protect wallet balances, sensitive personal contacts, and private keys from unauthorized physical access or local session hijacking.

### Threat Model Objectives
- **Local Access Control**: Prevent unauthorized individuals who gain physical access to an unlocked device from opening the wallet app or executing transfers.
- **In-Memory Protection**: Ensure sensitive key material is cleared from transient state when the app is locked or backgrounded.
- **Defense in Depth**: Combine device-level biometric/passcode hardware features with secure storage assumptions for non-custodial protection.

---

## 2. Lock Triggers & Session Assumptions

App locking operates on a session state machine governed by application lifecycle events and background state transitions.

```
       +--------------------+
       |   Cold Start /     |
       |  App Launch        |
       +---------+----------+
                 |
                 v
       +--------------------+
       |  App Lock Screen   | <----+
       |  (Unauthenticated) |      | Background / Timeout / Manual Lock
       +---------+----------+      |
                 |                 |
     Successful  | Unlock          |
     Auth        v                 |
       +--------------------+      |
       | Active Wallet      +------+
       | Session            |
       +--------------------+
```

### Lock Triggers
1. **Cold Launch**: Every fresh application start forces the lock screen if App Lock is enabled in settings.
2. **Backgrounding & Inactivity**:
   - Switching away from PocketPay to another app immediately sets the session state to `inactive`.
   - After a configurable background grace period (e.g., 30 seconds to 5 minutes), the session status transitions to `unauthenticated`.
3. **Manual Lock**: Users can tap a "Lock Wallet" action in Settings or the top navigation bar to lock the app instantly.
4. **Sensitive Actions Friction**: High-friction operations (such as revealing secret keys, exporting backups, or confirming large transfers) can re-trigger an authentication prompt even within an active session.

### Session Assumptions
- Active session state is maintained strictly in volatile RAM state (`appLockStore`).
- Locking the session immediately wipes decrypted secret keys or cached PIN credentials from memory.
- Session tokens are non-persistent; restarting the app invalidates all active session flags.

---

## 3. Unlock Methods: Biometrics & PIN

PocketPay supports dual-layer unlock options to accommodate varying device hardware capabilities and user security preferences.

### A. Biometric Authentication (Primary)
- **SDK**: Utilizes `expo-local-authentication`.
- **Supported Hardware**: iOS Face ID / Touch ID, Android Fingerprint / Biometric Prompt / Face Unlock.
- **Fallbacks**: When biometric hardware is unavailable or enrollment changes, the prompt seamlessly falls back to OS-level device passcode verification.

### B. Custom App PIN (Secondary / Standalone)
- **Concept**: A 4-digit to 6-digit numeric PIN created specifically within PocketPay.
- **Storage**: App PINs are never stored in plaintext. They are stored in `expo-secure-store` using PBKDF2 or SHA-256 with a unique per-device salt:
  $$\text{StoredHash} = \text{PBKDF2}(\text{Pin}, \text{Salt}, \text{iterations}=100,000)$$
- **Use Case**: Preferred by users who want a wallet-specific passcode separate from their device unlock PIN.

---

## 4. Failed Attempt Handling & Rate Limiting

To prevent brute-force attacks against the App PIN or biometric bypass attempts, the system enforces a strict lockout policy.

### Rate-Limiting Policy Matrix

| Failed Attempts | Consequence / Action | Delay Duration |
| :--- | :--- | :--- |
| **1 – 2** | Display error message; shake input field | None |
| **3** | Temporary lock; disable input | 30 seconds |
| **5** | Enforced cooldown period | 5 minutes |
| **10** | OS hardware lockout triggered / Fail-safe options shown | 15+ minutes (OS-enforced) |

### Fail-Safe & Emergency Recovery
- **OS Lockout**: Biometric failures beyond device thresholds delegate lockout enforcement to iOS Keychain / Android Keystore.
- **Wallet Reset Option**: If a user forgets their custom App PIN, PocketPay allows resetting local app data.
  > ⚠️ **Reset Caution**: Resetting local storage wipes the saved secret key. The user must re-import their wallet using their offline secret key backup.

---

## 5. Secure Storage & Cryptographic Assumptions

App Lock interacts with the platform storage layers to protect key material at rest and in memory:

1. **Keychain / Keystore Isolation**:
   - Wallet secret keys reside in `expo-secure-store` (`pocketpay_wallet_secret`).
   - On supported platforms, access flags can require `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
2. **RAM Hygiene**:
   - Secret key strings read during transaction signing are scoped within function calls and zeroed out upon function completion.
3. **Screen Overlay & Recents Privacy**:
   - On iOS and Android, app switcher preview cards should obscure sensitive balances and key views with a blurred overlay when backgrounded.

---

## 6. Implementation Boundaries & System Risks

| Boundary | Description & Mitigations |
| :--- | :--- |
| **Screen Lock vs Cryptographic Lock** | An app lock screen prevents UI interaction. However, unless secret keys are hardware-bound and require biometric authorization per signing, a compromised or rooted OS could bypass UI-only locks. |
| **Rooted / Jailbroken Devices** | Devices with compromised OS integrity bypass platform Keystore protections. App Lock cannot guarantee security on jailbroken environments. |
| **Backup Requirement** | App Lock is a convenience barrier. The offline paper backup of the Stellar Secret Key (`S...`) remains the ultimate authority for account ownership and recovery. |

---

## 7. Summary & Future Roadmap

Future iterations of PocketPay will continue to refine the App Lock model by:
- Adding configurable auto-lock timers (Immediate, 1 min, 5 min, 15 min).
- Exploring hardware-bound biometric key release for high-value transaction signing.
- Enhancing background blur previews in the multi-tasker view.
