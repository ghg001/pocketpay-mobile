import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { SIZES, RADIUS, ThemeColors } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useWalletStore } from '../src/store/walletStore';
import { useVaultStore } from '../src/store/vaultStore';
import {
  Info,
  Smartphone,
  Globe,
  Server,
  Wallet,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react-native';

interface DiagnosticItem {
  label: string;
  value: string;
  isSensitive?: boolean;
}

interface DiagnosticSection {
  title: string;
  icon: React.ReactNode;
  items: DiagnosticItem[];
}

/**
 * Truncates a public key for safe display.
 * Example: GABCD...WXYZ
 */
const truncatePublicKey = (key: string | null): string => {
  if (!key) return 'Not available';
  if (key.length <= 12) return key;
  return `${key.slice(0, 6)}...${key.slice(-6)}`;
};

/**
 * Extracts the host from a URL for safe display.
 */
const extractHost = (url: string | undefined): string => {
  if (!url) return 'Not configured';
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return 'Invalid URL';
  }
};

/**
 * Checks if secure storage is available on this device.
 */
const checkSecureStorageAvailability = async (): Promise<boolean> => {
  try {
    const testKey = '__diagnostics_test__';
    await SecureStore.setItemAsync(testKey, 'test');
    await SecureStore.deleteItemAsync(testKey);
    return true;
  } catch {
    return false;
  }
};

export default function DiagnosticsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { publicKey, error: walletError } = useWalletStore();
  const { balanceError: vaultError, isConfigured: vaultConfigured } = useVaultStore();

  const [isLoading, setIsLoading] = useState(true);
  const [secureStorageAvailable, setSecureStorageAvailable] = useState<boolean | null>(null);

  // Gate to development mode only
  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  useEffect(() => {
    const checkStorage = async () => {
      const available = await checkSecureStorageAvailability();
      setSecureStorageAvailable(available);
      setIsLoading(false);
    };
    checkStorage();
  }, []);

  // Gather diagnostic information
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const sdkVersion = Constants.expoConfig?.sdkVersion || 'Unknown';
  const appName = Constants.expoConfig?.name || 'stellar-pocketpay-mobile';

  const stellarNetwork = process.env.EXPO_PUBLIC_STELLAR_NETWORK || 'TESTNET';
  const horizonUrl = process.env.EXPO_PUBLIC_STELLAR_HORIZON_URL;
  const sorobanRpcUrl = process.env.EXPO_PUBLIC_SOROBAN_RPC_URL;
  const networkPassphrase = process.env.EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE;

  const sections: DiagnosticSection[] = [
    {
      title: 'App Information',
      icon: <Smartphone color={colors.primary} size={20} />,
      items: [
        { label: 'App Name', value: appName },
        { label: 'Version', value: appVersion },
        { label: 'Expo SDK', value: sdkVersion },
        { label: 'Platform', value: `${Platform.OS} ${Platform.Version}` },
        { label: 'Build Mode', value: __DEV__ ? 'Development' : 'Production' },
      ],
    },
    {
      title: 'Network Configuration',
      icon: <Globe color={colors.primary} size={20} />,
      items: [
        { label: 'Network', value: stellarNetwork },
        { label: 'Network Passphrase', value: networkPassphrase ? 'Configured' : 'Using default' },
      ],
    },
    {
      title: 'Service Endpoints',
      icon: <Server color={colors.primary} size={20} />,
      items: [
        { label: 'Horizon Host', value: extractHost(horizonUrl) || 'horizon-testnet.stellar.org' },
        { label: 'Soroban RPC Host', value: extractHost(sorobanRpcUrl) || 'Not configured' },
        { label: 'Vault Contract', value: vaultConfigured ? 'Configured' : 'Not configured (mock mode)' },
      ],
    },
    {
      title: 'Wallet State',
      icon: <Wallet color={colors.primary} size={20} />,
      items: [
        { label: 'Wallet Status', value: publicKey ? 'Connected' : 'Not connected' },
        { label: 'Public Key', value: truncatePublicKey(publicKey), isSensitive: true },
      ],
    },
    {
      title: 'Security & Storage',
      icon: <ShieldCheck color={colors.primary} size={20} />,
      items: [
        {
          label: 'Secure Storage',
          value: secureStorageAvailable === null
            ? 'Checking...'
            : secureStorageAvailable
            ? 'Available'
            : 'Unavailable',
        },
        { label: 'Biometric Support', value: Platform.OS === 'web' ? 'Not available' : 'Supported' },
      ],
    },
  ];

  // Add error summary if there are recent errors
  const errors: string[] = [];
  if (walletError) errors.push(`Wallet: ${walletError}`);
  if (vaultError) errors.push(`Vault: ${vaultError}`);

  if (errors.length > 0) {
    sections.push({
      title: 'Recent Errors',
      icon: <AlertCircle color={colors.error} size={20} />,
      items: errors.map((error, index) => ({
        label: `Error ${index + 1}`,
        value: error,
      })),
    });
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading diagnostics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Info color={colors.primary} size={24} />
          <Text style={styles.headerTitle}>Diagnostics</Text>
        </View>
      </View>

      <View style={styles.devBadge}>
        <Text style={styles.devBadgeText}>DEVELOPMENT BUILD</Text>
      </View>

      <Text style={styles.description}>
        This screen shows non-sensitive app and network information for debugging purposes.
        Secret keys are never displayed.
      </Text>

      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <View style={styles.sectionHeader}>
            {section.icon}
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.card}>
            {section.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                style={[
                  styles.row,
                  itemIndex < section.items.length - 1 && styles.rowBorder,
                ]}
              >
                <Text style={styles.label}>{item.label}</Text>
                <Text
                  style={[
                    styles.value,
                    item.isSensitive && styles.sensitiveValue,
                    section.title === 'Recent Errors' && styles.errorValue,
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This screen is only available in development builds.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: SIZES.lg,
      paddingBottom: SIZES.xxl * 2,
    },
    loadingText: {
      color: colors.textSecondary,
      marginTop: SIZES.md,
      fontSize: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SIZES.lg,
    },
    backButton: {
      width: 44,
      height: 44,
      paddingHorizontal: 0,
      marginRight: SIZES.md,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginLeft: SIZES.sm,
    },
    devBadge: {
      backgroundColor: colors.warning,
      paddingVertical: SIZES.xs,
      paddingHorizontal: SIZES.md,
      borderRadius: RADIUS.sm,
      alignSelf: 'flex-start',
      marginBottom: SIZES.md,
    },
    devBadgeText: {
      color: '#000',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: SIZES.xl,
    },
    section: {
      marginBottom: SIZES.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SIZES.sm,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: SIZES.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SIZES.md,
      paddingHorizontal: SIZES.lg,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      flex: 1,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'right',
      flex: 1,
      marginLeft: SIZES.md,
    },
    sensitiveValue: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 12,
    },
    errorValue: {
      color: colors.error,
      fontSize: 12,
    },
    footer: {
      alignItems: 'center',
      marginTop: SIZES.xl,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'center',
    },
  });
