import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Button } from '../../components/Button';
import { COLORS, SIZES, RADIUS } from '../../constants/theme';
import { useVaultStore } from './vaultStore';
import { useWalletStore } from '../../store/walletStore';
import { X, ArrowRightLeft, Lock, Wallet, AlertTriangle } from 'lucide-react-native';

interface WithdrawalPreviewProps {
  visible: boolean;
  onDismiss: () => void;
}

export const WithdrawalPreview: React.FC<WithdrawalPreviewProps> = ({
  visible,
  onDismiss,
}) => {
  const {
    vaultBalance,
    maturedLocks,
    isWithdrawing,
    withdrawalError,
    selectedWithdrawalType,
    selectedLockId,
    initiateWithdrawal,
    confirmWithdrawal,
    cancelWithdrawal,
    fetchVaultDetails,
  } = useVaultStore();

  const { publicKey, getSecretKey } = useWalletStore();

  const handleSelectAvailable = () => {
    initiateWithdrawal('available');
  };

  const handleSelectMatured = (lockId: string) => {
    initiateWithdrawal('matured', lockId);
  };

  const handleConfirm = async () => {
    const secret = await getSecretKey();
    if (!secret) {
      return;
    }
    const success = await confirmWithdrawal(secret);
    if (success && publicKey) {
      fetchVaultDetails(publicKey);
    }
  };

  const handleCancel = () => {
    cancelWithdrawal();
    onDismiss();
  };

  const hasAvailableBalance = parseFloat(vaultBalance) > 0;
  const hasMaturedLocks = maturedLocks.length > 0;
  const hasAnythingToWithdraw = hasAvailableBalance || hasMaturedLocks;

  const getSelectedAmount = (): string => {
    if (selectedWithdrawalType === 'available') return vaultBalance;
    if (selectedWithdrawalType === 'matured' && selectedLockId) {
      const lock = maturedLocks.find((l) => l.id === selectedLockId);
      return lock?.amount ?? '0.0000000';
    }
    return '0.0000000';
  };

  const getSelectedLabel = (): string => {
    if (selectedWithdrawalType === 'available') return 'Available Balance';
    if (selectedWithdrawalType === 'matured' && selectedLockId) {
      const lock = maturedLocks.find((l) => l.id === selectedLockId);
      return lock ? `Matured Lock #${lock.id.slice(0, 8)}` : 'Matured Lock';
    }
    return 'Select withdrawal source';
  };

  // Step 1: Choose withdrawal source, or Step 2: Review & confirm
  const isReviewing = selectedWithdrawalType !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Withdraw from Vault</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <X color={COLORS.primary} size={22} />
          </TouchableOpacity>
        </View>

        {/* Error banner */}
        {withdrawalError && (
          <View style={styles.errorBanner}>
            <AlertTriangle color={COLORS.error} size={18} />
            <Text style={styles.errorText}>{withdrawalError}</Text>
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {!isReviewing ? (
            <>
              {/* STEP 1: Choose withdrawal source */}
              <Text style={styles.sectionLabel}>Select Withdrawal Source</Text>

              {/* Available Balance Card */}
              <View
                style={[
                  styles.sourceCard,
                  !hasAvailableBalance && styles.sourceCardDisabled,
                ]}
              >
                <View style={styles.sourceCardHeader}>
                  <Wallet color={COLORS.primary} size={22} />
                  <Text style={styles.sourceCardTitle}>Available Balance</Text>
                </View>
                <Text style={styles.sourceAmount}>
                  {vaultBalance} XLM
                </Text>
                <Text style={styles.sourceDescription}>
                  Instantly withdrawable funds from your vault.
                </Text>
                <Button
                  title="Withdraw Available"
                  onPress={handleSelectAvailable}
                  disabled={!hasAvailableBalance}
                  style={styles.sourceAction}
                />
              </View>

              {/* Matured Locks Section */}
              <Text style={styles.sectionLabel}>Matured Locks</Text>
              {hasMaturedLocks ? (
                maturedLocks.map((lock) => (
                  <View key={lock.id} style={styles.sourceCard}>
                    <View style={styles.sourceCardHeader}>
                      <Lock color={COLORS.secondary} size={22} />
                      <Text style={styles.sourceCardTitle}>
                        Lock #{lock.id.slice(0, 12)}...
                      </Text>
                    </View>
                    <Text style={styles.sourceAmount}>
                      {lock.amount} XLM
                    </Text>
                    <Text style={styles.sourceDescription}>
                      Unlocked on {new Date(lock.unlockedAt).toLocaleDateString()}
                    </Text>
                    <Button
                      title="Withdraw This Lock"
                      variant="secondary"
                      onPress={() => handleSelectMatured(lock.id)}
                      style={styles.sourceAction}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Lock color={COLORS.textMuted} size={32} />
                  <Text style={styles.emptyText}>
                    No matured locks available.
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Locks appear here once they reach their unlock date.
                  </Text>
                </View>
              )}

              {!hasAnythingToWithdraw && (
                <View style={styles.emptyState}>
                  <Wallet color={COLORS.textMuted} size={32} />
                  <Text style={styles.emptyText}>
                    Nothing to withdraw yet.
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Deposit funds into the vault to start earning yield.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* STEP 2: Review & Confirm */}
              <Text style={styles.sectionLabel}>Review Withdrawal</Text>

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Source</Text>
                  <Text style={styles.summaryValue}>{getSelectedLabel()}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount</Text>
                  <Text style={styles.summaryAmount}>
                    {getSelectedAmount()} XLM
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Destination</Text>
                  <View style={styles.destinationContainer}>
                    <ArrowRightLeft
                      color={COLORS.textMuted}
                      size={14}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.destinationText} numberOfLines={1}>
                      {publicKey
                        ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
                        : 'Your wallet'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Destination full info */}
              {publicKey && (
                <View style={styles.destinationInfoBox}>
                  <Wallet color={COLORS.textSecondary} size={16} />
                  <Text style={styles.destinationInfoText} numberOfLines={2}>
                    Funds will be sent to your main wallet:{'\n'}
                    {publicKey}
                  </Text>
                </View>
              )}

              {/* Mock disclaimer */}
              <View style={styles.mockNotice}>
                <AlertTriangle color={COLORS.warning} size={16} />
                <Text style={styles.mockNoticeText}>
                  SDK integration is pending. This is a preview — no real
                  withdrawal will be executed.
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.reviewActions}>
                <Button
                  title="Confirm Withdrawal"
                  onPress={handleConfirm}
                  isLoading={isWithdrawing}
                  style={styles.confirmButton}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleCancel}
                  disabled={isWithdrawing}
                  style={styles.cancelButton}
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* Loading overlay for withdrawal */}
        {isWithdrawing && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing withdrawal...</Text>
              <Text style={styles.loadingSubtext}>
                This may take a moment (mock)
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 61, 0, 0.12)',
    marginHorizontal: SIZES.xl,
    marginTop: SIZES.md,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    gap: SIZES.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.25)',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.xl,
    paddingBottom: SIZES.xxl * 2,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SIZES.md,
    marginTop: SIZES.md,
  },
  sourceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  sourceCardDisabled: {
    opacity: 0.5,
  },
  sourceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  sourceCardTitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  sourceAmount: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
  },
  sourceDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SIZES.md,
  },
  sourceAction: {
    marginTop: SIZES.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    gap: SIZES.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  summaryAmount: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
  },
  destinationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  destinationInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceLight,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    gap: SIZES.sm,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  destinationInfoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
    lineHeight: 18,
  },
  mockNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.2)',
  },
  mockNoticeText: {
    color: COLORS.warning,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  reviewActions: {
    gap: SIZES.sm,
  },
  confirmButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 13, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SIZES.md,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
