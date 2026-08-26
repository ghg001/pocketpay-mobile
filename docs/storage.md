# Storage Guide

What data goes in SecureStore vs AsyncStorage.

## SecureStore (Encrypted)

| Data | Reason |
|------|--------|
| Secret keys (S...) | Full account control |
| Mnemonic phrases | Can derive secret keys |
| PIN codes | Authentication bypass |

## AsyncStorage (Unencrypted)

| Data | Reason |
|------|--------|
| Public keys (G...) | Public by design |
| Contacts | Address book |
| Transaction hashes | On-chain data |
| UI preferences | Non-sensitive |

## Rules

- Never store secret keys in AsyncStorage
- Never log secret keys or mnemonics
- Clear SecureStore on logout
- Public keys and tx hashes are safe in AsyncStorage
