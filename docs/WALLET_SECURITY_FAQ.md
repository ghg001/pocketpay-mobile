# Wallet Security FAQ

This FAQ explains how the PocketPay mobile wallet handles local storage, secret keys, reset behavior, and what remains the user's responsibility.

## Where is wallet data stored?

Wallet data is stored on the device.

Sensitive values such as secret keys are kept in secure device storage when possible, using platform protections like iOS Keychain and Android Keystore through `SecureStore`.

Non-sensitive app data may use local storage mechanisms such as `AsyncStorage` when appropriate.

## Does the app send my secret key to a server?

No.

Secret keys are used locally on the device to sign transactions. They should not be transmitted to a backend service as part of normal wallet operation.

## What security guarantees does the app provide?

The app is designed to support a non-custodial wallet model:

- Secret keys are intended to stay on your device.
- Signing should happen locally.
- The app should not be treated as a backup service for your wallet secrets.

These are design goals and implementation assumptions, not a promise that your device is safe from all threats.

## What does the app not guarantee?

The app does not guarantee:

- Protection if your device is compromised
- Protection if someone else can unlock your phone
- Recovery of lost secret keys or recovery phrases
- Safety on rooted, jailbroken, or otherwise untrusted devices

## What happens if I reset or uninstall the app?

Resetting or uninstalling the app removes locally stored app data from the device.

That means:

- Cached wallet data can be lost
- Stored secrets may be removed from the device
- The app may need to be set up again after reinstalling

This does not remove anything from the blockchain itself. Your wallet account still exists on chain.

## Can I recover my wallet if I lose my secret phrase?

Usually no.

If the app or wallet setup depends on a secret phrase or private key and you lose it, the wallet cannot be restored by the app or by the maintainers. Keep an offline backup in a safe place.

## What is the user's responsibility?

You are responsible for:

- Backing up your secret phrase or private key
- Keeping that backup offline and private
- Securing your phone with a passcode, biometrics, or both
- Avoiding untrusted devices and suspicious apps
- Keeping your operating system updated

## What should I do if I think my device is compromised?

Move funds to a new wallet from a trusted device as soon as possible.

If you believe your secret key may have been exposed, assume the old wallet is no longer safe.

## How should contributors use this FAQ?

Use this document when reviewing UI copy or wallet behavior so the app stays clear about local storage, resets, and user responsibility. Do not add language that suggests the app is a custodian, insurer, or guaranteed backup service.

