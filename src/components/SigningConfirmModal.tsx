import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';
import { ConfirmModal } from './ConfirmModal';
import { formatAmount } from '../utils/amount';

interface SigningConfirmModalProps {
  visible: boolean;
  isLoading?: boolean;
  recipientAddress: string;
  recipientLabel?: string | null;
  amount: string;
  memo?: string;
  network: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SigningConfirmModal: React.FC<SigningConfirmModalProps> = ({
  visible,
  isLoading = false,
  recipientAddress,
  recipientLabel,
  amount,
  memo,
  network,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ConfirmModal
      visible={visible}
      title="Confirm & Sign"
      message="You are approving this transaction. Review the details below before signing — this cannot be undone once submitted."
      confirmLabel="Sign & Send"
      cancelLabel="Cancel"
      isLoading={isLoading}
      icon={
        <View style={styles.iconBg}>
          <ShieldCheck color={colors.primary} size={32} />
        </View>
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <View style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Recipient</Text>
          <View style={styles.rowValueGroup}>
            {recipientLabel ? (
              <Text style={styles.rowValue}>{recipientLabel}</Text>
            ) : null}
            <Text style={recipientLabel ? styles.rowValueSecondary : styles.rowValue} numberOfLines={1} ellipsizeMode="middle">
              {recipientAddress}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Amount</Text>
          <Text style={styles.rowValueEmphasis}>{formatAmount(amount)} XLM</Text>
        </View>
        {memo ? (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Memo</Text>
              <Text style={styles.rowValue}>{memo}</Text>
            </View>
          </>
        ) : null}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Network</Text>
          <Text style={styles.rowValue}>{network}</Text>
        </View>
      </View>
      <View style={styles.approvalBanner}>
        <ArrowRight color={colors.primary} size={14} style={{ marginRight: SIZES.sm }} />
        <Text style={styles.approvalBannerText}>
          Signing will submit this payment to the network immediately.
        </Text>
      </View>
    </ConfirmModal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    iconBg: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(0, 229, 255, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsCard: {
      backgroundColor: colors.surfaceLight,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SIZES.md,
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
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    approvalBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(0, 229, 255, 0.08)',
      borderRadius: RADIUS.sm,
      padding: SIZES.sm,
      marginTop: SIZES.md,
    },
    approvalBannerText: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      flex: 1,
    },
  });
