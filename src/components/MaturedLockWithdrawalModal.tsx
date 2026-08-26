import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import {
  ArrowUpCircle,
  CheckCircle,
  AlertTriangle,
  Network,
  ShieldAlert,
  X,
} from 'lucide-react-native';
import type { MaturedLockWithdrawalResult } from '../store/vaultStore';
import type { WithdrawalErrorCopy, WithdrawalStep } from '../features/vault';

interface MaturedLockWithdrawalModalProps {
  step: WithdrawalStep;
  amount: string;
  /** Localized unlock date, shown so the user can see why this lock is eligible. */
  availableFrom: string | null;
  /** True when no vault contract is configured and nothing moves on-chain. */
  isPreview: boolean;
  result: MaturedLockWithdrawalResult | null;
  error: WithdrawalErrorCopy | null;
  contractId?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onClose: () => void;
}

const PREVIEW_NOTICE =
  'No vault contract is configured yet, so this is a preview of the withdrawal flow — no funds move on the network.';

const LIVE_NOTICE =
  'This submits a withdrawal to the Soroban Savings Vault on Testnet. The transaction is signed on this device.';

/**
 * Confirmation, loading, success, and failure steps for withdrawing a matured
 * vault lock. Rendering is driven entirely by `step`; the flow state itself
 * lives in `useMaturedLockWithdrawal`.
 */
export const MaturedLockWithdrawalModal: React.FC<MaturedLockWithdrawalModalProps> = ({
  step,
  amount,
  availableFrom,
  isPreview,
  result,
  error,
  contractId,
  onConfirm,
  onCancel,
  onRetry,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isSubmitting = step === 'submitting';

  return (
    <Modal
      visible={step !== 'idle'}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isSubmitting ? () => {} : onClose}
      testID="matured-lock-withdrawal-modal"
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {step === 'confirming' && (
              <>
                <View style={styles.header}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
                    <ArrowUpCircle color={colors.success} size={36} />
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onCancel}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close withdrawal"
                  >
                    <X color={colors.textMuted} size={22} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.title} accessibilityRole="header">
                  Withdraw matured lock
                </Text>
                <Text style={styles.description}>
                  This lock has matured. Confirm to return the full amount to your wallet.
                </Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={[styles.detailValue, { color: colors.success }]}>
                      {amount} XLM
                    </Text>
                  </View>

                  {availableFrom ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Matured on</Text>
                      <Text style={styles.detailValue}>{availableFrom}</Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <View style={styles.labelWithIcon}>
                      <Network color={colors.textMuted} size={14} style={{ marginRight: 4 }} />
                      <Text style={styles.detailLabel}>Network</Text>
                    </View>
                    <View style={styles.networkBadge}>
                      <Text style={styles.networkBadgeText}>Testnet</Text>
                    </View>
                  </View>

                  {contractId ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Contract</Text>
                      <Text
                        style={styles.detailValueMono}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {contractId}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.disclaimer}>
                  <ShieldAlert color={colors.textMuted} size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.disclaimerText}>
                    {isPreview ? PREVIEW_NOTICE : LIVE_NOTICE}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={onCancel}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.confirmButton,
                      { backgroundColor: colors.success },
                    ]}
                    onPress={onConfirm}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    testID="confirm-withdrawal-button"
                  >
                    <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {isSubmitting && (
              <View style={styles.statusContent} testID="withdrawal-loading">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.statusTitle}>Withdrawing {amount} XLM</Text>
                <Text style={styles.statusMessage}>
                  Hold on while the withdrawal is processed. Do not close the app.
                </Text>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.statusContent}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
                  <CheckCircle color={colors.success} size={36} />
                </View>
                <Text style={styles.statusTitle} accessibilityRole="header">
                  Withdrawal complete
                </Text>
                <Text style={styles.statusMessage}>
                  {result?.amount ?? amount} XLM is on its way back to your wallet.
                </Text>

                {result?.hash ? (
                  <View style={styles.hashBox}>
                    <Text style={styles.hashLabel}>Transaction</Text>
                    <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                      {result.hash}
                    </Text>
                  </View>
                ) : null}

                {result?.isPreview ? (
                  <View style={styles.disclaimer}>
                    <ShieldAlert color={colors.textMuted} size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.disclaimerText}>{PREVIEW_NOTICE}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.actionButton, styles.fullWidthButton, styles.confirmButton]}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.confirmButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'failed' && (
              <View style={styles.statusContent}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 61, 0, 0.12)' }]}>
                  <AlertTriangle color={colors.error} size={36} />
                </View>
                <Text style={styles.statusTitle} accessibilityRole="header">
                  {error?.title ?? 'Withdrawal failed'}
                </Text>
                <Text style={styles.statusMessage}>
                  {error?.message ??
                    'The withdrawal did not go through and your funds are still in the vault.'}
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>

                  {error?.canRetry !== false && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={onRetry}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      testID="retry-withdrawal-button"
                    >
                      <Text style={styles.confirmButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    scrollContent: {
      flexGrow: 1,
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
      width: '100%',
    },
    actionButton: {
      flex: 1,
      height: 50,
      borderRadius: RADIUS.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullWidthButton: {
      flexGrow: 0,
      width: '100%',
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
    statusContent: {
      alignItems: 'center',
    },
    statusTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: SIZES.md,
      marginBottom: SIZES.sm,
    },
    statusMessage: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: SIZES.lg,
    },
    hashBox: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: RADIUS.md,
      padding: SIZES.md,
      marginBottom: SIZES.lg,
    },
    hashLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: 2,
    },
    hashValue: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: 'monospace',
    },
  });
