import '../shim'; // MUST BE FIRST (See docs/polyfills.md for details)
import { useEffect, useRef, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { installGlobalErrorHandlers } from '../src/utils/globalErrorHandler';
import { StatusBar } from 'expo-status-bar';
import { useWalletStore } from '../src/store/walletStore';
import { useAppStore } from '../src/store/appStore';
import { LockScreen } from '../src/components/LockScreen';
import { WalletEmptyState } from '../src/components/WalletEmptyState';
import { StartupLoadingScreen } from '../src/components/StartupLoadingScreen';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Button } from '../src/components/Button';
import { ShieldAlert } from 'lucide-react-native';
import { SIZES, RADIUS } from '../src/constants/theme';
import { WalletResetConfirmModal } from '../src/components/WalletResetConfirmModal';
import {
  RESTORE_WALLET_ERROR,
  WALLET_CLEAR_FAILURE_MESSAGE,
} from '../src/utils/walletStorageErrors';

installGlobalErrorHandlers(); // MUST run before anything else can throw

export default function RootLayout() {
  return (
      <ErrorBoundary>
        <RootContent />
      </ErrorBoundary>
  );
}

function RootContent() {
  const { loadWalletFromStorage, publicKey, error, clearWallet, walletChecked } = useWalletStore();
  const { initializeApp, isInitialized } = useAppStore();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [startupMessage, setStartupMessage] = useState('Preparing your wallet…');

  // Deep link URL preservation: when a logged-out user arrives via a deep link,
  // we store the URL and replay it after authentication completes.
  const initialUrl = Linking.useURL();
  const pendingDeepLink = useRef<string | null>(null);

  useEffect(() => {
    // Start initialization with progress messages
    setStartupMessage('Loading your settings…');
    initializeApp();

    // Give a moment for app store to start loading before wallet
    setTimeout(() => {
      setStartupMessage('Restoring your wallet…');
      loadWalletFromStorage();
    }, 300);
  }, []);

  // Update progress message based on initialization state
  useEffect(() => {
    if (isInitialized && !walletChecked) {
      setStartupMessage('Restoring your wallet…');
    } else if (isInitialized && walletChecked && publicKey) {
      setStartupMessage('Wallet ready!');
      // Brief pause to show completion before navigation
      setTimeout(() => {
        setStartupMessage('Ready');
      }, 300);
    } else if (isInitialized && walletChecked && !publicKey) {
      setStartupMessage('Ready to get started');
    }
  }, [isInitialized, walletChecked, publicKey]);

  useEffect(() => {
    if (!isInitialized) return;
    // Wait for the initial wallet load to resolve too — `isInitialized` (app
    // settings) and `walletChecked` (wallet secret) load independently, and
    // deciding on `publicKey` before it's checked would flash-redirect a
    // returning signed-in user to the auth screens on cold start.
    if (!walletChecked) return;
    if (error === RESTORE_WALLET_ERROR) return; // Stay on error screen

    const inAuthGroup = segments[0] === '(auth)';

    if (publicKey && inAuthGroup) {
      // User is signed in and trying to access auth screens, redirect to main
      // If there's a pending deep link, replay it now that the user is authenticated.
      if (pendingDeepLink.current) {
        const url = pendingDeepLink.current;
        pendingDeepLink.current = null;
        // Use Linking.openURL to let Expo Router resolve the path from the full URL
        Linking.openURL(url);
      } else {
        router.replace('/(tabs)');
      }
    } else if (!publicKey && !inAuthGroup && segments[0] !== 'send' && segments[0] !== 'receive' && segments[0] !== 'review-transaction') {
      // User is NOT signed in and trying to access main screens, redirect to auth.
      // Preserve the deep link URL so we can replay it after authentication.
      if (initialUrl && !pendingDeepLink.current) {
        pendingDeepLink.current = initialUrl;
      }
      router.replace('/(auth)');
    }
  }, [publicKey, isInitialized, walletChecked, segments, error, initialUrl]);

  // --- STARTUP LOADING STATE ---
  // Show the dedicated startup loading screen while either store is initializing.
  // This ensures users see a clean, intentional loading experience rather than
  // the wallet empty state or a flash of incorrect content.
  if (!isInitialized || !walletChecked) {
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StartupLoadingScreen progressMessage={startupMessage} />
        </View>
    );
  }

  // --- WALLET RESTORE ERROR STATE ---
  if (error === RESTORE_WALLET_ERROR) {
    const handleRetry = async () => {
      setStartupMessage('Retrying wallet access…');
      await loadWalletFromStorage();
    };

    const handleReset = () => {
      setShowResetModal(true);
    };

    const handleResetConfirm = async () => {
      setIsResetting(true);
      const cleared = await clearWallet();
      setIsResetting(false);
      setShowResetModal(false);
      if (!cleared) {
        Alert.alert(
            'Reset Failed',
            WALLET_CLEAR_FAILURE_MESSAGE
        );
      }
    };

    return (
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <View style={styles.errorContent}>
            <ShieldAlert color={colors.error} size={64} style={{ marginBottom: SIZES.md }} />
            <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Secure Storage Inaccessible</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              PocketPay was unable to retrieve your wallet secret. This can happen due to device restrictions, locked keystore/keychain, or missing permissions.
            </Text>

            <View style={[styles.guidanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.guidanceTitle, { color: colors.textPrimary }]}>Troubleshooting Guidance:</Text>
              <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
                1. Unlock your phone if it was just restarted.{'\n'}
                2. Ensure device security (PIN, passcode, or biometrics) is active.{'\n'}
                3. Check that the app is permitted to use local authentication.{'\n'}
                4. Try restarting the app.
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Retry Access" onPress={handleRetry} style={{ marginBottom: SIZES.sm }} />
            <Button title="Reset & Import Again" variant="secondary" onPress={handleReset} />
          </View>

          <WalletResetConfirmModal
              visible={showResetModal}
              isLoading={isResetting}
              onConfirm={handleResetConfirm}
              onCancel={() => setShowResetModal(false)}
          />
        </View>
    );
  }

  // --- MAIN APP ---
  return (
      <>
        <StatusBar style="light" />
        <LockScreen>
          <Slot />
        </LockScreen>
      </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    padding: SIZES.xl,
    justifyContent: 'space-between',
    paddingBottom: SIZES.xxl,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  guidanceCard: {
    width: '100%',
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
  },
  guidanceText: {
    fontSize: 14,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
});