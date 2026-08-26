import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Button } from './Button';
import { useTheme } from '../hooks/useTheme';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';

interface Props {
  onUnlock?: () => void;
}

export const LockedWalletPlaceholder: React.FC<Props> = ({ onUnlock }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Lock size={28} color={colors.primary} />
      </View>

      <Text style={styles.heading}>Wallet Locked</Text>
      <Text style={styles.subtext}>
        Your balances and sensitive details are hidden. Tap below to authenticate and unlock.
      </Text>

      <View style={styles.blurBox}>
        <Text style={styles.label}>Available Balance</Text>
        <Text style={styles.hiddenValue}>•••••••• XLM</Text>
      </View>

      <Button title="Unlock Wallet" onPress={onUnlock} style={styles.btn} />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      padding: SIZES.lg,
      backgroundColor: colors.cardBackground,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: SIZES.md,
    },
    badge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SIZES.sm,
    },
    heading: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtext: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: SIZES.md,
    },
    blurBox: {
      width: '100%',
      paddingVertical: SIZES.md,
      backgroundColor: colors.background,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      marginBottom: SIZES.md,
    },
    label: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    hiddenValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    btn: {
      width: '100%',
    },
  });