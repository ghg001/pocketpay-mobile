import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { TransactionRecord } from '../store/walletStore';
import { useAppStore } from '../store/appStore';
import { resolveAddressLabel } from '../utils/contacts';
import { formatAmount } from '../utils/amount';
import { StatusBadge, BadgeTone } from './StatusBadge';

// Historical Horizon records have no `status` field and are implicitly
// confirmed, so they render with no badge. An unrecognized/malformed value
// also falls back to no badge rather than guessing a status.
const STATUS_BADGE: Record<string, { text: string; tone: BadgeTone }> = {
  pending: { text: 'Pending', tone: 'info' },
  confirmed: { text: 'Confirmed', tone: 'success' },
  failed: { text: 'Failed', tone: 'error' },
};

export interface TransactionListItemProps extends Omit<TouchableOpacityProps, 'onPress'> {
  /** The transaction data to display. */
  transaction: TransactionRecord;
  /**
   * The public key of the current wallet owner, used to determine
   * whether the transaction is sent or received.
   */
  currentPublicKey?: string | null;
  /** Called when the row is pressed. Omit to render a non-interactive row. */
  onPress?: (transaction: TransactionRecord) => void;
  /**
   * Visual variant — "card" adds a background and border (used in the
   * full history list), "inline" uses a transparent background with a
   * bottom divider (used inside a container card on the home screen).
   */
  variant?: 'card' | 'inline';
}

/**
 * Reusable row component for displaying a single transaction summary.
 * Handles missing fields gracefully and supports press behaviour.
 */
export const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  currentPublicKey,
  onPress,
  variant = 'card',
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const contacts = useAppStore((state) => state.contacts);

  const tx = transaction as any;
  const isSent = !!currentPublicKey && tx.from === currentPublicKey;

  const label = isSent ? 'Sent XLM' : 'Received XLM';

  const formattedAmount = tx.amount
    ? `${isSent ? '-' : '+'}${formatAmount(tx.amount)}`
    : null;

  const formattedDate = tx.created_at
    ? new Date(tx.created_at).toLocaleString()
    : null;

  // Counterparty: for sent txs show the recipient, for received show the sender
  const counterpartyAddress = isSent
    ? tx.to || null
    : tx.from || null;

  const counterpartyLabel = counterpartyAddress
    ? resolveAddressLabel(counterpartyAddress, contacts)
    : null;

  const statusBadge = tx.status ? STATUS_BADGE[tx.status] : undefined;

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? { ...props, onPress: () => onPress(transaction), activeOpacity: 0.7 }
    : props;

  return (
    <Container
      style={[
        styles.base,
        variant === 'card' ? styles.card : styles.inline,
        style,
      ]}
      {...(containerProps as any)}
    >
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
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>

        {counterpartyLabel ? (
          <Text style={styles.counterparty} numberOfLines={1} ellipsizeMode="middle">
            {counterpartyLabel.label}
          </Text>
        ) : null}

        {formattedDate ? (
          <Text style={styles.date}>{formattedDate}</Text>
        ) : null}
      </View>

      {/* Right-side amount + status */}
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

        {tx.asset ? (
          <Text style={styles.assetType}>
            {tx.asset}
          </Text>
        ) : null}

        {statusBadge ? (
          <View style={styles.statusBadgeWrapper}>
            <StatusBadge text={statusBadge.text} tone={statusBadge.tone} />
          </View>
        ) : null}
      </View>
    </Container>
  );
};

const SENT_BG = 'rgba(255, 61, 0, 0.10)';
const RECEIVED_BG = 'rgba(0, 230, 118, 0.10)';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /** Stand-alone card row (History screen). */
  card: {
    backgroundColor: colors.surface,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: RADIUS.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  /** Inline row inside an existing card (Home screen). */
  inline: {
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  counterparty: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  date: {
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
  assetType: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadgeWrapper: {
    marginTop: 4,
  },
});