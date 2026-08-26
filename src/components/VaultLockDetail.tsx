import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useVaultStore, Lock } from '../store/vaultStore';
import { useRouter } from 'expo-router';
import { Calendar, Clock, DollarSign, Lock as LockIcon, Unlock, Info, Timer, HelpCircle } from 'lucide-react-native';
import { formatTimeRemaining, getEligibilityText } from '../utils/lockTime';
import { useMaturedLockWithdrawal } from '../features/vault/useMaturedLockWithdrawal';
import { MaturedLockWithdrawalModal } from './MaturedLockWithdrawalModal';

interface VaultLockDetailProps {
  lock: Lock;
}

export const VaultLockDetail: React.FC<VaultLockDetailProps> = ({ lock }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const contractId = useVaultStore((state) => state.contractId);
  const withdrawal = useMaturedLockWithdrawal(lock);

  const isMatured = lock.status === 'matured';
  const unlockDate = new Date(lock.unlockDate);
  const createdAt = new Date(lock.createdAt);
  const countdown = formatTimeRemaining(lock.unlockDate);
  const eligibility = getEligibilityText(lock.unlockDate, lock.status);
  const canWithdraw = withdrawal.eligibility.isEligible;

  const handleWithdrawalClosed = () => {
    const succeeded = withdrawal.step === 'success';
    withdrawal.close();
    // The lock is gone from the vault once the withdrawal settles, so leave the
    // detail screen rather than rendering its "not found" state.
    if (succeeded) router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, {
            backgroundColor: isMatured
              ? 'rgba(0, 230, 118, 0.12)'
              : 'rgba(123, 97, 255, 0.12)',
          }]}>
            {isMatured ? (
              <Unlock color={colors.success} size={28} />
            ) : (
              <LockIcon color={colors.secondary} size={28} />
            )}
          </View>
          <View style={styles.headerTextContent}>
            <Text style={styles.amount}>{lock.amount} XLM</Text>
            <View style={[styles.statusBadge, {
              backgroundColor: isMatured
                ? 'rgba(0, 230, 118, 0.12)'
                : 'rgba(123, 97, 255, 0.12)',
            }]}>
              <Text style={[styles.statusText, {
                color: isMatured
                  ? colors.success
                  : colors.secondary,
              }]}>
                {isMatured ? 'Ready to withdraw' : 'Locked'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Calendar color={colors.textMuted} size={18} style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Locked on:</Text>
          <Text style={styles.detailValue}>{createdAt.toLocaleDateString()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Clock color={colors.textMuted} size={18} style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Available from:</Text>
          <Text style={styles.detailValue}>{unlockDate.toLocaleDateString()}</Text>
        </View>

        {!isMatured && countdown ? (
          <View style={styles.detailRow}>
            <Timer color={colors.textMuted} size={18} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Time left:</Text>
            <Text style={[styles.detailValue, { color: colors.secondary }]}>{countdown}</Text>
          </View>
        ) : null}

        {/* Eligibility explanation */}
        <View style={styles.eligibilityBox}>
          <Info color={isMatured ? colors.success : colors.secondary} size={18} style={styles.detailIcon} />
          <Text style={[styles.eligibilityText, {
            color: isMatured ? colors.success : colors.textSecondary,
          }]}>
            {eligibility}
          </Text>
        </View>

        {/* A matured lock can still be blocked — e.g. no wallet is loaded. */}
        {isMatured && !canWithdraw ? (
          <Text style={styles.blockedText}>{withdrawal.eligibility.message}</Text>
        ) : null}

        {isMatured && (
          <TouchableOpacity
            style={[styles.withdrawButton, !canWithdraw && styles.withdrawButtonDisabled]}
            onPress={withdrawal.start}
            disabled={!canWithdraw}
            accessibilityLabel="Withdraw funds"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canWithdraw }}
            testID="withdraw-funds-button"
          >
            <DollarSign color={canWithdraw ? colors.background : colors.textMuted} size={20} />
            <Text
              style={[
                styles.withdrawButtonText,
                !canWithdraw && styles.withdrawButtonTextDisabled,
              ]}
            >
              Withdraw Funds
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <MaturedLockWithdrawalModal
        step={withdrawal.step}
        amount={lock.amount}
        availableFrom={withdrawal.eligibility.availableFrom}
        isPreview={withdrawal.isPreview}
        result={withdrawal.result}
        error={withdrawal.error}
        contractId={contractId || undefined}
        onConfirm={withdrawal.confirm}
        onCancel={withdrawal.cancel}
        onRetry={withdrawal.retry}
        onClose={handleWithdrawalClosed}
      />

      {/* Inline education card */}
      <View style={styles.educationCard}>
        <View style={styles.educationHeader}>
          <HelpCircle color={colors.primary} size={20} style={{ marginRight: SIZES.sm }} />
          <Text style={styles.educationTitle}>How locked funds work</Text>
        </View>
        <Text style={styles.educationBody}>
          • <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Why funds are locked:</Text> Locked funds are held in the vault to help you commit to long-term savings goals and avoid premature spending.
        </Text>
        <Text style={styles.educationBody}>
          • <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Unlock timing:</Text> The unlock date is determined by the lock duration (e.g., 30 days) set when created and monitored by the smart contract's network schedule.
        </Text>
        <Text style={styles.educationBody}>
          • <Text style={{ fontWeight: '600', color: colors.textPrimary }}>When withdrawable:</Text> As soon as the unlock date is reached, your status updates to "Ready to withdraw" and you can return the XLM to your main wallet at any time with no deadline.
        </Text>
        <Text style={styles.educationFootnote}>
          Testnet preview — no real funds are involved.
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    padding: SIZES.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SIZES.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  headerTextContent: {
    flex: 1,
  },
  amount: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  detailIcon: {
    marginRight: SIZES.sm,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    marginRight: SIZES.xs,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  eligibilityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(123, 97, 255, 0.06)',
    borderRadius: RADIUS.md,
    padding: SIZES.md,
    marginTop: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  eligibilityText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  withdrawButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  withdrawButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  withdrawButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SIZES.xs,
  },
  withdrawButtonTextDisabled: {
    color: colors.textMuted,
  },
  blockedText: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
    marginTop: SIZES.sm,
  },
  // ── Inline education card ──────────────────────────────────────
  educationCard: {
    backgroundColor: colors.surface,
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SIZES.lg,
  },
  educationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  educationTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  educationBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: SIZES.sm,
  },
  educationFootnote: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: SIZES.xs,
  },
});