# Wallet Lock Placeholder Notes

This component serves as a design-ready placeholder for hiding sensitive wallet data when locked.

## Future Hooks
- **Store state**: Read `isLocked` from `useWalletStore` or `useAppLockStore`.
- **Unlock trigger**: Pass biometric/PIN prompt trigger to `onUnlock`.
- **Inactivity lock**: Update store on background timeout.