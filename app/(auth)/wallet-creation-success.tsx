import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AsyncActionButton } from '../../src/components/AsyncActionButton';
import { SIZES, ThemeColors } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { CheckCircle } from 'lucide-react-native';

export default function WalletCreationSuccessScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleGoToWallet = () => {
    router.replace('/(tabs)');
  };

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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SIZES.xl,
      justifyContent: 'space-between',
      paddingBottom: SIZES.xxl,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    successIcon: {
      alignItems: 'center',
      marginBottom: SIZES.lg,
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
  });
