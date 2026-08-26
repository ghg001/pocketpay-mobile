import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StrKey } from '@stellar/stellar-sdk';
import { AsyncActionButton } from '../../src/components/AsyncActionButton';
import { FormField } from '../../src/components/FormField';
import { WalletEmptyState } from '../../src/components/WalletEmptyState';
import { SIZES, RADIUS, ThemeColors } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { useWalletStore } from '../../src/store/walletStore';
import { WALLET_SAVE_FAILURE_MESSAGE } from '../../src/utils/walletStorageErrors';
import { importWallet } from 'pocketpay-sdk';
import { Info, Shield, CheckCircle } from 'lucide-react-native';
import type { OnboardingError, StorageError } from '../../src/types/onboarding';
import {
  classifyOnboardingError,
  mapWalletErrorToStorageError,
} from '../../src/types/onboarding';

const SECRET_KEY_LENGTH = 56;

export default function ImportWalletScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { setWallet } = useWalletStore();
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Recovery states
  const [onboardingError, setOnboardingError] = useState<OnboardingError | null>(null);
  const [storageError, setStorageError] = useState<StorageError | null>(null);

  const resetErrors = () => {
    setOnboardingError(null);
    setStorageError(null);
  };

  /**
   * Validate the trimmed secret key and return a user-friendly error,
   * or null if it passes all checks.
   */
  function validateSecretKey(trimmedKey: string): string | null {
    if (!trimmedKey) {
      return 'Please enter your secret key.';
    }

    if (!trimmedKey.startsWith('S')) {
      return 'Stellar secret keys start with "S". Check your key and try again.';
    }

    if (trimmedKey.length < SECRET_KEY_LENGTH) {
      return `Your secret key is too short. Stellar secret keys are exactly ${SECRET_KEY_LENGTH} characters.`;
    }

    if (trimmedKey.length > SECRET_KEY_LENGTH) {
      return `Your secret key is too long. Stellar secret keys are exactly ${SECRET_KEY_LENGTH} characters.`;
    }

    // Quick invalid-character check so users see a specific message before
    // the SDK's generic checksum error.
    const base32Regex = /^[A-Z2-7]+$/;
    if (!base32Regex.test(trimmedKey)) {
      return 'Secret key contains invalid characters. Only uppercase letters A-Z and digits 2-7 are allowed.';
    }

    // Use the Stellar SDK's built-in validation which verifies the base32
    // encoding, version byte, and CRC16 checksum.
    if (!StrKey.isValidEd25519SecretSeed(trimmedKey)) {
      return "This doesn't look like a valid Stellar secret key. Double-check that you've copied the complete key correctly.";
    }

    return null;
  }

  const handleImport = async () => {
    setError('');
    resetErrors();

    const trimmedKey = secretKey.trim();

    // Client-side validation first
    const validationError = validateSecretKey(trimmedKey);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const { publicKey } = await importWallet(trimmedKey);

      const saved = await setWallet(publicKey, trimmedKey);
      if (!saved) {
        // Classify the storage error
        setStorageError(mapWalletErrorToStorageError(WALLET_SAVE_FAILURE_MESSAGE));
        return;
      }

      setIsSuccess(true);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      setOnboardingError(classifyOnboardingError(errorMsg));
    }
  };

  const handleGoToWallet = () => {
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    resetErrors();
    setError('');
  };

  const handleStartOver = () => {
    resetErrors();
    setError('');
    setSecretKey('');
  };

  // ── Storage Error State ────────────────────────────────────
  if (storageError) {
    return (
      <View style={styles.container}>
        <WalletEmptyState
          variant="storage_error"
          storageError={storageError}
          onRetry={handleRetry}
          onStartOver={handleStartOver}
        />
      </View>
    );
  }

  // ── Onboarding Error State ─────────────────────────────────
  if (onboardingError) {
    return (
      <View style={styles.container}>
        <WalletEmptyState
          variant="failed_import"
          onboardingError={onboardingError}
          onRetry={handleRetry}
          onCreate={handleStartOver}
        />
      </View>
    );
  }

  // ── Success State ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.contentCenter}>
          <View style={styles.successIcon}>
            <CheckCircle color={colors.success} size={64} />
          </View>
          <Text style={styles.title}>Wallet Imported!</Text>
          <Text style={styles.subtitle}>
            Your Testnet wallet has been restored. You can now send and receive test XLM.
          </Text>
        </View>
        <AsyncActionButton title="Go to Wallet" onPress={handleGoToWallet} />
      </View>
    );
  }

  // ── Import Form ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Import Wallet</Text>
          <Text style={styles.subtitle}>
            Enter your Stellar secret key to restore your wallet.
          </Text>
        </View>

        <View style={styles.infoBanner}>
          <Info color={colors.primary} size={18} />
          <Text style={styles.infoText}>
            This app runs on <Text style={styles.infoBold}>Testnet</Text>. Only test-net secret keys will work.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <Shield color={colors.warning} size={18} />
          <Text style={styles.warningText}>
            Never paste your secret key from an untrusted source. Anyone with this key can access your funds.
          </Text>
        </View>

        <FormField
          label="Secret Key"
          placeholder="S…"
          value={secretKey}
          onChangeText={(text) => {
            setSecretKey(text);
            setError('');
          }}
          secureTextEntry
          error={error}
          helperText={`${SECRET_KEY_LENGTH}-character key starting with "S"`}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <AsyncActionButton
        title="Import Wallet"
        onPress={handleImport}
        loadingText="Importing…"
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: SIZES.xl,
    justifyContent: 'space-between',
    paddingBottom: SIZES.xxl,
  },
  content: {
    flex: 1,
  },
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SIZES.lg,
    marginTop: SIZES.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    padding: SIZES.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    padding: SIZES.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.25)',
    marginBottom: SIZES.lg,
    gap: SIZES.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
});
