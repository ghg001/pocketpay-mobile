import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../components/Button';
import { COLORS, SIZES, RADIUS } from '../../constants/theme';
import {
  PiggyBank,
  X,
  ArrowDownToLine,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
} from 'lucide-react-native';

export interface DepositPreviewParams {
  amount: string;
  asset: string;
  walletBalance: string;
  vaultContractId: string | null;
  isConfigured: boolean;
  isSubmitting: boolean;
  error: string | null;
}

interface DepositPreviewProps {
  visible: boolean;
  params: DepositPreviewParams;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DepositPreview: React.FC<DepositPreviewProps> = ({
  visible,
  params,
  onConfirm,
  onCancel,
}) => {
  const {
    amount,
    asset,
    walletBalance,
    vaultContractId,
    isConfigured,
    isSubmitting,
    error,
  } = params;

  const numericAmount = parseFloat(amount) || 0;
  const numericBalance = parseFloat(walletBalance) || 0;
  const postDepositBalance = Math.max(0, numericBalance - numericAmount);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Deposit to Vault</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X color={COLORS.primary} size={22} />
          </TouchableOpacity>
        </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertTriangle color={COLORS.error} size={18} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Deposit Summary Card */}
          <Text style={styles.sectionLabel}>Deposit Summary</Text>

          <View style={styles.summaryCard}>
            {/* Amount */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconLabel}>
                <ArrowDownToLine color={COLORS.primary} size={20} />
                <Text style={styles.summaryLabel}>Amount</Text>
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.summaryAmount}>
                  {amount || '0.00'} {asset}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Asset */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconLabel}>
                <Coins color={COLORS.secondary} size={20} />
                <Text style={styles.summaryLabel}>Asset</Text>
              </View>
              <View style={styles.summaryRight}>
                <View style={styles.assetBadge}>
                  <Text style={styles.assetBadgeText}>{asset}</Text>
                </View>
                <Text style={styles.assetSubtext}>Stellar Native</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Destination Vault */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconLabel}>
                <PiggyBank color={COLORS.primary} size={20} />
                <Text style={styles.summaryLabel}>Destination</Text>
              </View>
              <View style={styles.summaryRight}>
                {isConfigured && vaultContractId ? (
                  <Text style={styles.destinationText}>
                    {vaultContractId.slice(0, 8)}…{vaultContractId.slice(-6)}
                  </Text>
                ) : (
                  <View style={styles.mockBadge}>
                    <Text style={styles.mockBadgeText}>Mock Vault</Text>
                  </View>
                )}
                <Text style={styles.assetSubtext}>Soroban Contract</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Expected Result */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconLabel}>
                <TrendingUp color={COLORS.success} size={20} />
                <Text style={styles.summaryLabel}>Expected Yield</Text>
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.yieldText}>~5% APY</Text>
                <Text style={styles.assetSubtext}>Variable (mock estimate)</Text>
              </View>
            </View>
          </View>

          {/* Post-deposit balance preview */}
          <View style={styles.balancePreviewCard}>
            <Text style={styles.balancePreviewLabel}>Wallet Balance After Deposit</Text>
            <Text style={styles.balancePreviewValue}>
              {postDepositBalance.toFixed(7)} {asset}
            </Text>
          </View>

          {/* Contract / Mock notice */}
          {isConfigured ? (
            <View style={styles.infoBox}>
              <ShieldCheck color={COLORS.success} size={18} style={{ marginRight: SIZES.sm }} />
              <Text style={styles.infoText}>
                This deposit will submit a real transaction to the Soroban vault contract.
                Funds will be transferred from your wallet to the vault.
              </Text>
            </View>
          ) : (
            <View style={styles.mockNotice}>
              <AlertTriangle color={COLORS.warning} size={18} style={{ marginRight: SIZES.sm }} />
              <Text style={styles.mockNoticeText}>
                SDK integration is pending — this is a preview. No real deposit will be
                executed. The vault balance shown is a mock value.
              </Text>
            </View>
          )}

          {/* Lock notice */}
          <View style={styles.lockNotice}>
            <Clock color={COLORS.textSecondary} size={16} style={{ marginRight: SIZES.sm }} />
            <Text style={styles.lockNoticeText}>
              Deposited funds are managed by the Soroban vault contract. Withdrawals may be
              subject to contract-defined rules and lock periods. Review the contract terms
              before depositing.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={isConfigured ? 'Confirm Deposit' : 'Confirm (Mock)'}
              onPress={onConfirm}
              isLoading={isSubmitting}
              disabled={!amount || numericAmount <= 0 || numericAmount > numericBalance}
              style={styles.confirmButton}
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>

        {/* Loading overlay */}
        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing deposit...</Text>
              <Text style={styles.loadingSubtext}>
                {isConfigured
                  ? 'Submitting transaction to the network'
                  : 'This may take a moment (mock)'}
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
    paddingVertical: SIZES.sm + 2,
  },
  summaryIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryAmount: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  assetBadge: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginBottom: 2,
  },
  assetBadgeText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  assetSubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  destinationText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  mockBadge: {
    backgroundColor: 'rgba(255, 196, 0, 0.15)',
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginBottom: 2,
  },
  mockBadgeText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  yieldText: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  balancePreviewCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balancePreviewLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  balancePreviewValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  infoText: {
    color: COLORS.success,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  mockNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.2)',
  },
  mockNoticeText: {
    color: COLORS.warning,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lockNoticeText: {
    color: COLORS.textMuted,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
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
    textAlign: 'center',
  },
});
