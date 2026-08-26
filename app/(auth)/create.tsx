import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AsyncActionButton } from '../../src/components/AsyncActionButton';
import { WalletEmptyState } from '../../src/components/WalletEmptyState';
import { SIZES, RADIUS, ThemeColors } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { generateKeypair } from '../../src/services/stellar';
import { useWalletStore } from '../../src/store/walletStore';
import { WALLET_SAVE_FAILURE_MESSAGE } from '../../src/utils/walletStorageErrors';
import { AlertTriangle, Info, Shield, CheckCircle } from 'lucide-react-native';
import { SecretKeyReveal } from '../../src/components/SecretKeyReveal';
import type { OnboardingError, StorageError } from '../../src/types/onboarding';
import {
  classifyOnboardingError,
  mapWalletErrorToStorageError,
} from '../../src/types/onboarding';

export default function CreateWalletScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { setWallet, markBackupPending } = useWalletStore();
  const [keypair, setKeypair] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Recovery states
  const [onboardingError, setOnboardingError] = useState<OnboardingError | null>(null);
  const [storageError, setStorageError] = useState<StorageError | null>(null);

  const resetErrors = () => {
    setOnboardingError(null);
    setStorageError(null);
  };

  const handleGenerate = () => {
    resetErrors();
    try {
      const keys = generateKeypair();
      setKeypair(keys);
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      setOnboardingError(classifyOnboardingError(errorMsg));
    }
  };


  const handleContinue = async () => {
    if (!keypair) return;

    Alert.alert(
      'Save Your Secret Key',
      'This key is the only way to access your wallet. Without it, funds cannot be recovered. Have you saved it?',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Yes, I Saved It',
          onPress: async () => {
            resetErrors();
            setIsLoading(true);
            const saved = await setWallet(keypair.publicKey, keypair.secretKey);
            setIsLoading(false);
            if (!saved) {
              // Classify the storage error
              setStorageError(mapWalletErrorToStorageError(WALLET_SAVE_FAILURE_MESSAGE));
              return;
            }
            await markBackupPending();
            router.replace('/(auth)/wallet-creation-success');
          }
        }
      ]
    );
  };


  const handleRetry = () => {
    resetErrors();
    if (keypair) {
      // If we have a keypair, retry the save
      handleContinue();
    } else {
      // Otherwise, retry keypair generation
      handleGenerate();
    }
  };

  const handleStartOver = () => {
    resetErrors();
    setKeypair(null);
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
          variant="failed_creation"
          onboardingError={onboardingError}
          onRetry={handleRetry}
          onStartOver={handleStartOver}
        />
      </View>
    );
  }

  // ── Success State ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <CheckCircle color={colors.success} size={64} />
          </View>
          <Text style={styles.title}>Wallet Created!</Text>
          <Text style={styles.subtitle}>
            Your Testnet wallet is ready. Fund it with the Friendbot on the home screen to start sending test XLM.
          </Text>
        </View>
        <AsyncActionButton title="Go to Wallet" onPress={handleGoToWallet} />
      </View>
    );
  }

  // ── Generate State ─────────────────────────────────────────
  if (!keypair) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.infoBanner}>
            <Info color={colors.primary} size={20} />
            <Text style={styles.infoText}>
              You're on <Text style={styles.infoBold}>Stellar Testnet</Text>. Wallets use test funds only — no real value.
            </Text>
          </View>

          <Text style={styles.title}>Create Wallet</Text>
          <Text style={styles.subtitle}>
            A new keypair will be generated on your device. Your secret key stays private and never leaves this phone.
          </Text>
        </View>
        <AsyncActionButton title="Generate Keypair" onPress={handleGenerate} />
      </View>
    );
  }

  // ── Keypair Reveal State ───────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
      <View style={styles.warningCard}>
        <AlertTriangle color={colors.warning} size={32} style={{ marginBottom: SIZES.sm }} />
        <Text style={styles.warningTitle}>Save Your Secret Key</Text>
        <Text style={styles.warningText}>
          This is the <Text style={styles.warningBold}>only way</Text> to access your wallet. Anyone with this key can control your funds. Store it safely — it cannot be recovered.
        </Text>
      </View>

      <View style={styles.keyContainer}>
        <Text style={styles.keyLabel}>Public Key (Your Address)</Text>
        <View style={styles.keyBox}>
          <Text style={styles.keyValue} selectable>{keypair.publicKey}</Text>
        </View>
      </View>

      <View style={styles.keyContainer}>
        <Text style={styles.keyLabel}>Secret Key</Text>
        <SecretKeyReveal secretKey={keypair.secretKey} />
      </View>

      <View style={styles.securityNote}>
        <Shield color={colors.textMuted} size={16} />
        <Text style={styles.securityNoteText}>
          Copy and store your secret key offline. Never share it with anyone.
        </Text>
      </View>

      <AsyncActionButton
        title="I've Saved It — Continue"
        onPress={handleContinue}
        isLoading={isLoading}
        style={{ marginTop: SIZES.xl }}
      />
    </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: SIZES.xl,
    paddingBottom: SIZES.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: SIZES.xl,
    gap: SIZES.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.3)',
    marginBottom: SIZES.xl,
    alignItems: 'center',
  },
  warningTitle: {
    color: colors.warning,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
  },
  warningText: {
    color: colors.warning,
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBold: {
    fontWeight: 'bold',
    color: colors.warning,
  },
  keyContainer: {
    marginBottom: SIZES.lg,
  },
  keyLabel: {
    color: colors.textSecondary,
    marginBottom: SIZES.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  keyBox: {
    backgroundColor: colors.surface,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyValue: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.sm,
    paddingHorizontal: SIZES.xs,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
});
