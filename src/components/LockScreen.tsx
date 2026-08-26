import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus, Platform } from 'react-native';
import { useAppLockStore } from '../store/appLockStore';
import { useWalletStore } from '../store/walletStore';
import { Button } from './Button';
import { COLORS, SIZES, RADIUS } from '../constants/theme';
import { Shield, Fingerprint, Smartphone } from 'lucide-react-native';

interface LockScreenProps {
  children: React.ReactNode;
}

export const LockScreen: React.FC<LockScreenProps> = ({ children }) => {
  const { isLockEnabled, isAuthenticated, isAuthenticating, hasBiometrics, authError, authenticate, lock, initializeLock } =
    useAppLockStore();
  const { publicKey } = useWalletStore();

  // Initialize lock state on mount
  useEffect(() => {
    initializeLock();
  }, []);

  // Handle app state changes (foreground/background)
  const handleAppStateChange = useCallback(
    (nextState: AppStateStatus) => {
      // When coming back from background, lock the app if lock is enabled and user has a wallet
      if (nextState === 'active' && isLockEnabled && publicKey) {
        // Check if we recently authenticated (within last 30 seconds — don't re-lock on quick switches)
        // We lock on every resume for security
        lock();
      }
    },
    [isLockEnabled, publicKey, lock]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // No wallet or lock not enabled — show children directly
  if (!publicKey || !isLockEnabled) {
    return <>{children}</>;
  }

  // Lock is enabled, wallet exists, but user is authenticated — show children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Lock screen
  const handleUnlock = async () => {
    await authenticate();
  };

  const authIcon = hasBiometrics ? (
    <Fingerprint color={COLORS.primary} size={48} />
  ) : (
    <Smartphone color={COLORS.primary} size={48} />
  );

  const promptText = hasBiometrics
    ? 'Authenticate with biometrics to unlock your wallet.'
    : 'Enter your device passcode to unlock your wallet.';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield color={COLORS.primary} size={32} />
        </View>

        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.subtitle}>{promptText}</Text>

        <View style={styles.authArea}>
          <View style={styles.authIconContainer}>{authIcon}</View>

          {authError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}

          <Button
            title={isAuthenticating ? 'Authenticating…' : 'Unlock'}
            onPress={handleUnlock}
            isLoading={isAuthenticating}
            style={styles.unlockButton}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          PocketPay is locked to protect your wallet.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 9999,
    justifyContent: 'space-between',
    padding: SIZES.xl,
    paddingTop: SIZES.xxl * 2,
    paddingBottom: SIZES.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.md,
  },
  authArea: {
    alignItems: 'center',
    width: '100%',
  },
  authIconContainer: {
    marginBottom: SIZES.xl,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.2)',
    marginBottom: SIZES.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  unlockButton: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingTop: SIZES.lg,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
