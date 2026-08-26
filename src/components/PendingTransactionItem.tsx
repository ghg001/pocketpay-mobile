/**
 * PendingTransactionItem
 *
 * A specialised row for displaying a single pending transaction in the
 * queue view. Shows the transaction type, amount, counterparty, time
 * since submission, and a "Pending" status badge.
 *
 * Unlike TransactionListItem, this component:
 *  - Always renders with the "card" variant styling
 *  - Shows relative time since submission (e.g. "2 min ago")
 *  - Does NOT offer a retry action (unsafe retry messaging is avoided)
 *  - Includes a pulsing dot indicator for visual pending status
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/appStore';
import { TransactionRecord } from '../store/walletStore';
import { resolveAddressLabel } from '../utils/contacts';
import { formatAmount } from '../utils/amount';
import { StatusBadge } from './StatusBadge';

interface PendingTransactionItemProps {
  /** The pending transaction record. */
  transaction: TransactionRecord;
  /** The public key of the current wallet owner. */
  currentPublicKey?: string | null;
}

/**
 * Format a relative time string from a timestamp (e.g. "2 min ago", "1 hr ago").
 */
function formatRelativeTime(isoDate: string | undefined): string {
  if (!isoDate) return 'just now';

  const now = Date.now();
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 'just now';

  const diffMs = now - then;
  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Derive a display label for the transaction type.
 */
function getTypeLabel(tx: Record<string, any>): string {
  if (tx.type === 'invoke_host_function' || tx.is_vault === true) {
    return 'Vault';
  }
  if (tx.type === 'payment') return 'Payment';
  return 'Transaction';
}

export const PendingTransactionItem: React.FC<PendingTransactionItemProps> = ({
  transaction,
  currentPublicKey,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const contacts = useAppStore((state) => state.contacts);

  const tx = transaction as Record<string, any>;
  const isSent = !!currentPublicKey && tx.from === currentPublicKey;

  const label = isSent ? 'Sent XLM' : 'Received XLM';
  const formattedAmount = tx.amount
    ? `${isSent ? '-' : '+'}${formatAmount(tx.amount)} ${tx.asset || 'XLM'}`
    : null;

  const counterpartyAddress = isSent ? tx.to || null : tx.from || null;
  const counterpartyLabel = counterpartyAddress
    ? resolveAddressLabel(counterpartyAddress, contacts)
    : null;

  const relativeTime = formatRelativeTime(tx.created_at);
  const typeLabel = getTypeLabel(tx);

  return (
    <View style={styles.container} testID="pending-transaction-item">
      {/* Direction icon */}
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: isSent ? SENT_BG : RECEIVED_BG },
        ]}
      >
        {isSent ? (
          <ArrowUpRight color={colors.error} size={20} />
        ) : (
          <ArrowDownLeft color={colors.success} size={20} />
        )}
      </View>

      {/* Centre info */}
      <View style={styles.info}>
        <View style={styles.labelRow}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{typeLabel}</Text>
          </View>
        </View>

        {counterpartyLabel ? (
          <Text style={styles.counterparty} numberOfLines={1} ellipsizeMode="middle">
            {counterpartyLabel.label}
          </Text>
        ) : null}

        <View style={styles.timeRow}>
          <Clock color={colors.textMuted} size={12} style={styles.timeIcon} />
          <Text style={styles.timeAgo}>{relativeTime}</Text>
        </View>
      </View>

      {/* Right side: amount + status */}
      <View style={styles.right}>
        {formattedAmount ? (
          <Text
            style={[
              styles.amount,
              { color: isSent ? colors.textPrimary : colors.success },
            ]}
          >
            {formattedAmount}
          </Text>
        ) : (
          <Text style={styles.amountMissing}>—</Text>
        )}
        <View style={styles.statusWrapper}>
          <StatusBadge text="Pending" tone="info" />
        </View>
      </View>
    </View>
  );
};

const SENT_BG = 'rgba(255, 61, 0, 0.10)';
const RECEIVED_BG = 'rgba(0, 230, 118, 0.10)';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: SIZES.lg,
      paddingVertical: SIZES.md,
      borderRadius: RADIUS.md,
      marginBottom: SIZES.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SIZES.md,
    },
    info: {
      flex: 1,
      marginRight: SIZES.sm,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SIZES.xs,
      marginBottom: 2,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '500',
    },
    typeTag: {
      backgroundColor: 'rgba(0, 229, 255, 0.10)',
      paddingHorizontal: SIZES.xs,
      paddingVertical: 1,
      borderRadius: RADIUS.sm,
    },
    typeTagText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    counterparty: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 2,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeIcon: {
      marginRight: 4,
    },
    timeAgo: {
      color: colors.textMuted,
      fontSize: 12,
    },
    right: {
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 15,
      fontWeight: '700',
    },
    amountMissing: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
    },
    statusWrapper: {
      marginTop: 4,
    },
  });
