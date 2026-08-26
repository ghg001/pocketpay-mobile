/**
 * PendingTransactionQueue
 *
 * Displays all pending transactions from the wallet store's optimistic
 * pending map. Shows a dedicated section header, individual pending items
 * with time-since-submission, a refresh action, and safe guidance text
 * when the queue is empty.
 *
 * This component does NOT offer retry actions — the acceptance criteria
 * explicitly require that unsafe retry messaging is avoided. Pending
 * transactions are reconciled automatically on pull-to-refresh.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw, Clock, CheckCircle } from 'lucide-react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore, TransactionRecord } from '../store/walletStore';
import { PendingTransactionItem } from './PendingTransactionItem';

interface PendingTransactionQueueProps {
  /** Called when the user taps the refresh button. */
  onRefresh?: () => void;
  /** True while a refresh is in flight. */
  isRefreshing?: boolean;
}

/**
 * Empty state shown when there are no pending transactions.
 * Provides safe guidance about what pending means.
 */
const QueueEmptyState: React.FC<{ colors: ThemeColors }> = ({ colors }) => (
  <View style={emptyStyles.container} testID="pending-queue-empty">
    <CheckCircle color={colors.success} size={32} style={emptyStyles.icon} />
    <Text style={emptyStyles.title}>All caught up</Text>
    <Text style={emptyStyles.message}>
      No pending transactions. All submitted payments have been confirmed on
      the network.
    </Text>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SIZES.lg,
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  icon: {
    marginBottom: SIZES.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: SIZES.xs,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export const PendingTransactionQueue: React.FC<PendingTransactionQueueProps> = ({
  onRefresh,
  isRefreshing = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { pendingTransactions, publicKey } = useWalletStore();

  const pendingList = useMemo(
    () => Object.values(pendingTransactions ?? {}),
    [pendingTransactions],
  );

  const count = pendingList.length;

  return (
    <View style={styles.container} testID="pending-transaction-queue">
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock color={colors.primary} size={16} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Pending</Text>
          {count > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          ) : null}
        </View>

        {onRefresh && count > 0 ? (
          <TouchableOpacity
            onPress={onRefresh}
            disabled={isRefreshing}
            style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Refresh pending transactions"
            accessibilityState={{ disabled: isRefreshing }}
            testID="pending-queue-refresh"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RefreshCw
              color={isRefreshing ? colors.textMuted : colors.primary}
              size={14}
              style={isRefreshing ? styles.spinning : undefined}
            />
            <Text
              style={[
                styles.refreshText,
                isRefreshing && styles.refreshTextDisabled,
              ]}
            >
              Refresh
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Guidance text when there are pending items */}
      {count > 0 ? (
        <Text style={styles.guidance}>
          These transactions have been submitted and are waiting for network
          confirmation. They will be removed automatically once confirmed.
        </Text>
      ) : null}

      {/* Pending items or empty state */}
      {count > 0 ? (
        pendingList.map((tx) => (
          <PendingTransactionItem
            key={tx.id}
            transaction={tx}
            currentPublicKey={publicKey}
          />
        ))
      ) : (
        <QueueEmptyState colors={colors} />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: SIZES.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SIZES.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SIZES.xs,
    },
    headerIcon: {
      marginRight: 2,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    countBadge: {
      backgroundColor: 'rgba(0, 229, 255, 0.15)',
      paddingHorizontal: SIZES.sm,
      paddingVertical: 1,
      borderRadius: RADIUS.round,
      marginLeft: SIZES.xs,
    },
    countBadgeText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    guidance: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: SIZES.md,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SIZES.sm,
      paddingVertical: SIZES.xs,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 4,
    },
    refreshButtonDisabled: {
      borderColor: colors.border,
    },
    refreshText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    refreshTextDisabled: {
      color: colors.textMuted,
    },
    spinning: {
      // Simple rotation animation would require Animated API;
      // for now the icon just appears dimmed while refreshing.
    },
  });
