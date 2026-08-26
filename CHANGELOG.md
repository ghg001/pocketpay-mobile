# Changelog

All notable changes to **Stellar PocketPay** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Wallet creation with auto-generated Stellar Testnet keypair
- Wallet import via secret key
- Secure on-device key storage using `expo-secure-store`
- Real-time XLM balance fetching from Stellar Testnet Horizon API
- Transaction history screen with recent activity
- Send XLM to any valid Stellar address with memo support
- Receive screen with auto-generated QR code for easy sharing
- Address Book for saving and managing frequently used Stellar addresses
- Soroban Vault mock UI as a placeholder for future smart contract integration
- Tab navigation: Home, History, Vault, Settings
- Auth flow with onboarding, wallet creation, and import screens
- Dark mode support with a clean, modern fintech aesthetic
- Reusable `Button` and `Input` component library
- Global state management with Zustand
- React Native polyfills for Stellar SDK compatibility
- Local public API compatibility check for `pocketpay-sdk` exports (`npm run api:check` / `api:update`), with a committed baseline in `api-reports/pocketpay-sdk.api.md`

### Changed

### Fixed
- QR scanner no longer processes duplicate `onBarcodeScanned` events for the same code, preventing duplicate navigation/field updates on rapid-fire camera callbacks (#104)

### Security

---

[Unreleased]: https://github.com/Axionvera/pocketpay-mobile/commits/main
