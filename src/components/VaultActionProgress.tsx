import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { VaultActionState } from '../types/vault';
import { VAULT_ACTION_LABELS } from '../types/vault';

export interface VaultActionProgressProps {
  state: VaultActionState;
  errorMessage?: string;
}

const STATE_COLOR_KEY: Record<VaultActionState, keyof ThemeColors> = {
  idle: 'textMuted',
  review: 'textSecondary',
  signing: 'primary',
  submission: 'primary',
  pending: 'warning',
  confirmed: 'success',
  failed: 'error',
};

/**
 * VaultActionProgress
 *
 * Small status pill that shows which stage a vault action (deposit, lock,
 * withdraw) is currently in. Pairs with AsyncActionButton — the button shows
 * a generic busy spinner, this pill shows the specific stage (signing vs.
 * submitting vs. pending), satisfying the "signing and submitting are
 * distinct" requirement from #332.
 */
export const VaultActionProgress: React.FC<VaultActionProgressProps> = ({
  state,
  errorMessage,
}: VaultActionProgressProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (state === 'idle') return null;

  const color = colors[STATE_COLOR_KEY[state]] as string;
  const label = state === 'failed' && errorMessage ? errorMessage : VAULT_ACTION_LABELS[state];

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SIZES.sm,
      paddingVertical: 6,
      borderRadius: RADIUS.round,
      borderWidth: 1,
      alignSelf: 'flex-start',
      marginBottom: SIZES.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: SIZES.xs,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
      flexShrink: 1,
    },
  });
