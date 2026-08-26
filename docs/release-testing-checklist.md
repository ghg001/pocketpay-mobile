# Release Testing Checklist

## Status

**Applies to:** iOS and Android mobile releases of PocketPay  
**Last updated:** 2026-07-28  

---

## 1. Pre-Release Checks

### 1.1 Wallet

- [ ] Wallet connects successfully (Freighter / WalletConnect).
- [ ] Wallet reconnects after app restart.
- [ ] Wrong network detection + prompt to switch.
- [ ] Wallet disconnect + reconnect flow.
- [ ] Multiple wallet switch (if supported).

### 1.2 Payments (Send)

- [ ] Send payment to Stellar address.
- [ ] Send payment to contact.
- [ ] Send payment via QR scan.
- [ ] Send with memo attached.
- [ ] Send maximum balance.
- [ ] Error state: insufficient balance shows clear message.
- [ ] Error state: invalid destination shows validation.
- [ ] Error state: network timeout shows retry option.

### 1.3 Payments (Receive)

- [ ] QR code displays and is scannable.
- [ ] "Copy address" copies to clipboard.
- [ ] Receive from contact.
- [ ] Receive with amount pre-filled from QR.
- [ ] Deep link: `pocketpay://` opens correct receive screen.

### 1.4 Contacts / Address Book

- [ ] Add contact.
- [ ] Edit contact.
- [ ] Delete contact.
- [ ] Contact sync across devices (if applicable).
- [ ] Search/filter contacts.
- [ ] Select contact for send flow.

### 1.5 Transactions / History

- [ ] Transaction list loads (pull-to-refresh).
- [ ] Transaction detail screen opens.
- [ ] Stellar explorer link works.
- [ ] Pagination loads more transactions.
- [ ] Filter by status (pending, completed, failed).

### 1.6 Vault Operations

- [ ] Deposit to vault.
- [ ] Withdraw from vault.
- [ ] Vault balance display correct.
- [ ] Vault event log loads.

---

## 2. Regression Scenarios

- [ ] App cold start → wallet connect → send payment.
- [ ] App cold start → wallet connect → receive.
- [ ] Background → foreground preserves session.
- [ ] Rapid send/cancel 3x in a row.
- [ ] Network switch (testnet ↔ mainnet) mid-flow.
- [ ] Large contact list (100+ contacts) scroll + search.
- [ ] QR scan with non-PocketPay address shows clear error.
- [ ] Simultaneous receive notification + send flow.

---

## 3. Platform-Specific

### iOS

- [ ] Notifications (push) received.
- [ ] Notifications tap opens correct screen.
- [ ] Share sheet integration works.
- [ ] Keyboard handling: send amount field.
- [ ] Safe area on notch devices.
- [ ] Dark mode appearance.

### Android

- [ ] Notifications (push / FCM) received.
- [ ] Notification tap opens correct screen.
- [ ] Back button navigation correct.
- [ ] Keyboard handling: send amount field.
- [ ] Activity recreation after rotation.
- [ ] App links / deep links work.

---

## 4. Secure Storage

- [ ] Private key stored in secure enclave / keychain.
- [ ] Key wiped on app uninstall.
- [ ] Clipboard timeout (clears after 30s).
- [ ] No key material in logs.
- [ ] Redact sensitive data in crash reports.

---

## 5. Diagnostics & Settings

- [ ] App version displayed.
- [ ] Network selection persists.
- [ ] Clear cache works.
- [ ] Reset wallet works (with confirmation).
- [ ] Log export works.
- [ ] Diagnostic report shows SDK version + network.

---

## 6. Accessibility (a11y)

- [ ] All interactive elements have accessibility labels.
- [ ] Screen reader (VoiceOver / TalkBack) navigates send flow.
- [ ] Colour contrast meets WCAG AA.
- [ ] Dynamic type / font scaling works.
- [ ] Focus management on dialog open/close.

---

## 7. Unsupported Features (Smoke)

- [ ] Unsupported network shows human-friendly message.
- [ ] Unsupported asset type shows clear error.
- [ ] Developer mode toggle hidden in production builds.

---

## 8. Pre-Merge Review

- [ ] All CI checks pass (lint, test, build).
- [ ] CHANGELOG updated.
- [ ] README updated if API/setup changed.
- [ ] Release notes drafted.

---

## 9. Post-Release

- [ ] Tag created in git.
- [ ] Release notes published on GitHub.
- [ ] Crash-free rate monitored for 48h.
- [ ] Rollback plan documented.
