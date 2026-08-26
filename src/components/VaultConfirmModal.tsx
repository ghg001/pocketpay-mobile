import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  X,
  ShieldAlert,
  Network,
} from 'lucide-react-native';

export type VaultAction = 'deposit' | 'withdraw' | 'lock';

interface VaultConfirmModalProps {
  visible: boolean;
  actionType: VaultAction;
  amount: string;
  isLoading?: boolean;
  contractId?: string;
  unlockTime?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Issue #331: Optional capability warning shown in the detail section. */
  capabilityWarning?: string | null;
}

export const VaultConfirmModal: React.FC<VaultConfirmModalProps> = ({
  visible,
  actionType,
  amount,
  isLoading = false,
  contractId,
  unlockTime,
  onConfirm,
  onCancel,
  capabilityWarning,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const actionConfig: Record<
    VaultAction,
    {
      title: string;
      icon: React.ReactNode;
      iconBg: string;
      accentColor: string;
      actionLabel: string;
      description: string;
    }
  > = {
    deposit: {
      title: 'Confirm Deposit',
      icon: <ArrowDownCircle color={colors.success} size={36} />,
      iconBg: 'rgba(0, 230, 118, 0.12)',
      accentColor: colors.success,
      actionLabel: 'Confirm Deposit',
      description:
        'You are about to move funds into the Soroban Savings Vault. While this is a mock contract, the vault internally tracks your deposit.',
    },
    withdraw: {
      title: 'Confirm Withdrawal',
      icon: <ArrowUpCircle color={colors.warning} size={36} />,
      iconBg: 'rgba(255, 196, 0, 0.12)',
      accentColor: colors.warning,
      actionLabel: 'Confirm Withdrawal',
      description:
        'You are about to withdraw funds from the Soroban Savings Vault. This is a mock interaction and does not represent real custody.',
    },
    lock: {
      title: 'Confirm Lock',
      icon: <Lock color={colors.secondary} size={36} />,
      iconBg: 'rgba(123, 97, 255, 0.12)',
      accentColor: colors.secondary,
      actionLabel: 'Confirm Lock',
      description:
        'You are about to set aside funds for 30 days. During this time the locked amount stays safely in your vault but cannot be withdrawn until the unlock date.',
    },
  };

  const config = actionConfig[actionType];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
              {config.icon}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
              disabled={isLoading}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X color={colors.textMuted} size={22} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.description}>{config.description}</Text>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {/* Amount */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue, { color: config.accentColor }]}>
                {amount} XLM
              </Text>
            </View>

            {/* Action Type */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Action</Text>
              <Text style={styles.detailValue}>
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </Text>
            </View>

            {/* Network */}
            <View style={styles.detailRow}>
              <View style={styles.labelWithIcon}>
                <Network color={colors.textMuted} size={14} style={{ marginRight: 4 }} />
                <Text style={styles.detailLabel}>Network</Text>
              </View>
              <View style={styles.networkBadge}>
                <Text style={styles.networkBadgeText}>Testnet</Text>
              </View>
            </View>

            {/* Contract ID (optional) */}
            {contractId ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contract</Text>
                <Text style={styles.detailValueMono} numberOfLines={1} ellipsizeMode="middle">
                  {contractId}
                </Text>
              </View>
            ) : null}

            {/* Unlock Time (lock action only) */}
            {actionType === 'lock' && unlockTime ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Unlock Time</Text>
                <Text style={[styles.detailValue, { color: colors.secondary }]}>
                  {unlockTime}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Issue #331: Capability warning */}
          {capabilityWarning ? (
            <View style={styles.capabilityWarning}>
              <ShieldAlert color={colors.warning} size={14} style={{ marginRight: 6 }} />
              <Text style={styles.capabilityWarningText}>
                {capabilityWarning}
              </Text>
            </View>
          ) : null}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <ShieldAlert color={colors.textMuted} size={14} style={{ marginRight: 6 }} />
            <Text style={styles.disclaimerText}>
              This is a mock Soroban smart contract. Balances are tracked internally and do not
              represent real on-chain custody.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.confirmButton,
                { backgroundColor: config.accentColor },
              ]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.background} size="small" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmButtonText}>Processing {actionType}…</Text>
                </View>
              ) : (
                <Text style={styles.confirmButtonText}>{config.actionLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.xl,
    padding: SIZES.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
    position: 'relative',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.lg,
  },
  detailsContainer: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  detailValueMono: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
    maxWidth: '55%',
  },
  networkBadge: {
    backgroundColor: 'rgba(255, 196, 0, 0.15)',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  networkBadgeText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  capabilityWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    borderRadius: RADIUS.sm,
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.3)',
  },
  capabilityWarningText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(160, 170, 191, 0.08)',
    borderRadius: RADIUS.sm,
    padding: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  disclaimerText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceLight,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
