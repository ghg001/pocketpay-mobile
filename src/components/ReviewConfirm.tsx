import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { AsyncActionButton } from './AsyncActionButton';

export interface ReviewItem {
  /** Row heading, e.g. "Amount". */
  label: string;
  /** Primary value. Rendered as-is — format before passing it in. */
  value: string;
  /** Optional dimmer line under the value, e.g. the raw address behind a contact name. */
  secondaryValue?: string | null;
  /** Draws the value in the accent colour at a larger size. */
  emphasis?: boolean;
  /** Truncates in the middle — for addresses and hashes. */
  truncate?: boolean;
}

export interface ReviewConfirmProps {
  items: ReviewItem[];
  /**
   * Omit both `confirmLabel` and `onConfirm` to render the summary card on its
   * own — for phases where the details still matter but acting on them does not
   * (in flight, completed, failed).
   */
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  cancelLabel?: string;
  onCancel?: () => void;
  /** Copy shown while `onConfirm` is in flight. */
  loadingText?: string;
  /** Forces the busy state when the pending flag lives in a store outside this component. */
  isLoading?: boolean;
  confirmDisabled?: boolean;
  /** Explains to assistive tech why confirm is unavailable. */
  confirmDisabledHint?: string;
  /** Marks the confirm action as irreversible. */
  destructive?: boolean;
  /** Contextual note rendered under the detail rows (fees, warnings, security copy). */
  note?: React.ReactNode;
  /** Extra content between the rows and the actions. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Summarises the whole card for screen readers. Defaults to a joined label/value list. */
  accessibilityLabel?: string;
}

/**
 * ReviewConfirm
 *
 * "Check these details, then commit" surface shared by the flows that move
 * funds — payment review, vault deposit/withdraw, and anything else that needs
 * a last look before an irreversible action.
 *
 * The detail rows are exposed to assistive tech as a single readable summary so
 * a screen-reader user hears the whole transaction before reaching the confirm
 * button, rather than tabbing through disconnected label/value fragments.
 */
export const ReviewConfirm: React.FC<ReviewConfirmProps> = ({
  items,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  loadingText = 'Processing…',
  isLoading = false,
  confirmDisabled = false,
  confirmDisabledHint,
  destructive = false,
  note,
  children,
  style,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const summary = useMemo(
    () =>
      accessibilityLabel ??
      items
        .map((item) =>
          [item.label, item.value, item.secondaryValue].filter(Boolean).join(': '),
        )
        .join(', '),
    [accessibilityLabel, items],
  );

  return (
    <View style={style} testID="review-confirm">
      <View
        style={styles.card}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={summary}
      >
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <View style={styles.rowValueGroup}>
                <Text
                  style={item.emphasis ? styles.rowValueEmphasis : styles.rowValue}
                  numberOfLines={item.truncate ? 1 : undefined}
                  ellipsizeMode={item.truncate ? 'middle' : undefined}
                >
                  {item.value}
                </Text>
                {item.secondaryValue ? (
                  <Text
                    style={styles.rowValueSecondary}
                    numberOfLines={item.truncate ? 1 : undefined}
                    ellipsizeMode={item.truncate ? 'middle' : undefined}
                  >
                    {item.secondaryValue}
                  </Text>
                ) : null}
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>

      {note ? (
        <View style={styles.note}>
          {typeof note === 'string' ? <Text style={styles.noteText}>{note}</Text> : note}
        </View>
      ) : null}

      {children}

      {onConfirm || onCancel ? (
        <View style={styles.actions}>
          {onConfirm && confirmLabel ? (
            <AsyncActionButton
              title={confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              onPress={onConfirm}
              isLoading={isLoading}
              loadingText={loadingText}
              disabled={confirmDisabled}
              accessibilityHint={confirmDisabled ? confirmDisabledHint : undefined}
            />
          ) : null}
          {onCancel ? (
            <AsyncActionButton
              title={cancelLabel ?? 'Cancel'}
              variant="secondary"
              onPress={onCancel}
              disabled={isLoading}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      padding: SIZES.md,
      marginBottom: SIZES.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: SIZES.sm,
    },
    rowLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      width: 80,
    },
    rowValueGroup: {
      flex: 1,
      alignItems: 'flex-end',
    },
    rowValue: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'right',
      flexShrink: 1,
    },
    rowValueSecondary: {
      color: colors.textMuted,
      fontSize: 11,
      textAlign: 'right',
      marginTop: 2,
    },
    rowValueEmphasis: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    note: {
      marginBottom: SIZES.md,
    },
    noteText: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
    },
    actions: {
      gap: SIZES.sm,
    },
  });
