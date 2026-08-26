/**
 * BalanceDisplay
 *
 * Renders the wallet balance with support for all balance states:
 *   - loading: shimmer / spinner while the balance is being fetched
 *   - available: shows the numeric balance (may be zero or positive)
 *   - unavailable: shows a friendly error with a retry button
 *   - idle: no fetch attempted yet
 *
 * Accessibility: uses accessibilityRole="header" for the balance value and
 * accessibilityRole="alert" for the unavailable state.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { RefreshCw, AlertTriangle, EyeOff } from 'lucide-react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { BalanceState } from '../types/balance';
import { describeBalanceState } from '../types/balance';
import { formatAmount } from '../utils/amount';

export interface BalanceDisplayProps {
  /** The current balance state. */
  state: BalanceState;
  /** The numeric balance, only meaningful when state is 'available'. */
  balance: string;
  /** The wallet public key for display. */
  publicKey?: string | null;
  /** Called when the user taps the retry / refresh action. */
  onRetry?: () => void;
  /** True while a retry is in flight. */
  isRetrying?: boolean;
  /** Optional label above the balance (e.g. "Total Balance (Testnet)"). */
  label?: string;
  /** Optional last-refreshed timestamp (epoch ms). */
  lastRefreshed?: number | null | undefined;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  state,
  balance,
  publicKey,
  onRetry,
  isRetrying = false,
  label = 'Total Balance (Testnet)',
  lastRefreshed,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = useMemo(() => describeBalanceState(state), [state]);

  // ── Loading state ─────────────────────────────────────────────────
  if (state === 'idle' || state === 'loading') {
    return (
      <View style={styles.card} accessibilityLabel="Balance loading">
        <Text style={styles.label}>{label}</Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: SIZES.sm }} />
          <Text style={styles.loadingText}>{copy.title}</Text>
        </View>
        {publicKey ? (
          <Text style={styles.publicKey} numberOfLines={1} ellipsizeMode="middle">
            {publicKey}
          </Text>
        ) : null}
      </View>
    );
  }

  // ── Unavailable state ────────────────────────────────────────────
  if (state === 'unavailable') {
    return (
      <View
        style={[styles.card, styles.cardUnavailable]}
        accessibilityRole="alert"
        accessibilityLabel={`Balance unavailable. ${copy.message}`}
      >
        <View style={styles.unavailableHeader}>
          <AlertTriangle color={colors.warning} size={18} style={{ marginRight: SIZES.sm }} />
          <Text style={styles.unavailableTitle}>{copy.title}</Text>
        </View>
        <Text style={styles.unavailableMessage}>{copy.message}</Text>
        {publicKey ? (
          <Text style={styles.publicKey} numberOfLines={1} ellipsizeMode="middle">
            {publicKey}
          </Text>
        ) : null}
        {onRetry && copy.retryLabel ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            disabled={isRetrying}
            accessibilityRole="button"
            accessibilityLabel={copy.retryLabel}
            activeOpacity={0.7}
          >
            <RefreshCw
              color={isRetrying ? colors.textMuted : colors.primary}
              size={14}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.retryText, isRetrying && styles.retryTextDisabled]}>
              {isRetrying ? 'Refreshing…' : copy.retryLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  // ── Available state (zero or positive) ───────────────────────────
  const isZero = balance === '0.0000000' || parseFloat(balance) === 0;

  return (
    <View style={styles.card} accessibilityRole="header" accessibilityLabel={`Balance: ${formatAmount(balance)} XLM`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.balanceValue, isZero && styles.balanceZero]}>
        {formatAmount(balance)} XLM
      </Text>
      {publicKey ? (
        <Text style={styles.publicKey} numberOfLines={1} ellipsizeMode="middle">
          {publicKey}
        </Text>
      ) : null}
      {lastRefreshed != null && (
        <View style={styles.lastRefreshedRow}>
          <RefreshCw color={colors.textMuted} size={12} />
          <Text style={styles.lastRefreshedText}>
            Updated {formatRelativeTime(lastRefreshed)}
          </Text>
        </View>
      )}
      {isZero && (
        <View style={styles.zeroBanner}>
          <EyeOff color={colors.textMuted} size={14} style={{ marginRight: 4 }} />
          <Text style={styles.zeroText}>
            This account has no XLM balance. Use "Fund with Friendbot" below to get testnet XLM.
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      padding: SIZES.xl,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      marginBottom: SIZES.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardUnavailable: {
      borderColor: colors.warning,
      borderStyle: 'dashed',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: SIZES.xs,
    },
    balanceValue: {
      color: colors.textPrimary,
      fontSize: 36,
      fontWeight: 'bold',
      marginBottom: SIZES.sm,
    },
    balanceZero: {
      color: colors.textMuted,
    },
    publicKey: {
      color: colors.textMuted,
      fontSize: 12,
      backgroundColor: colors.background,
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.xs,
      borderRadius: RADIUS.round,
      overflow: 'hidden',
      maxWidth: '100%',
    },
    lastRefreshedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: SIZES.sm,
    },
    lastRefreshedText: {
      color: colors.textMuted,
      fontSize: 11,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SIZES.sm,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    unavailableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SIZES.sm,
    },
    unavailableTitle: {
      color: colors.warning,
      fontSize: 16,
      fontWeight: '600',
    },
    unavailableMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: SIZES.sm,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.sm,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      marginTop: SIZES.xs,
    },
    retryText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    retryTextDisabled: {
      color: colors.textMuted,
    },
    zeroBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(160, 170, 191, 0.08)',
      paddingHorizontal: SIZES.sm,
      paddingVertical: SIZES.sm,
      borderRadius: RADIUS.sm,
      marginTop: SIZES.md,
      width: '100%',
    },
    zeroText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
  });
