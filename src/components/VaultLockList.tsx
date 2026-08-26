import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';
import { Lock, CheckCircle, Clock, Info } from 'lucide-react-native';
import { Lock as LockType } from '../hooks/useVault';
import { formatTimeRemaining } from '../utils/lockTime';

interface VaultLockListProps {
  locks: LockType[];
  isLoading: boolean;
  onUnlock?: (lockId: string) => void;
  onInfoPress?: () => void;
  /** Issue #331: When unlock is not supported, show this reason instead of the unlock button. */
  unlockDisabledReason?: string | null;
}

export const VaultLockList: React.FC<VaultLockListProps> = ({
  locks,
  isLoading,
  onUnlock,
  onInfoPress,
  unlockDisabledReason,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const handlePress = (lockId: string) => {
    router.push(`/vault/${lockId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading locks...</Text>
      </View>
    );
  }

  if (locks.length === 0) {
    return (
      <View style={styles.container}>
        <Lock color={colors.textMuted} size={48} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No locked funds</Text>
        <Text style={styles.emptySubtitle}>
          Locking sets your XLM aside for a fixed period (30 days) so it can't be spent accidentally. Once the time is up you can withdraw freely.
        </Text>
        {onInfoPress && (
          <TouchableOpacity style={styles.emptyLearnMore} onPress={onInfoPress}>
            <Info color={colors.primary} size={14} style={{ marginRight: 4 }} />
            <Text style={styles.emptyLearnMoreText}>How does locking work?</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {locks.map((lock) => {
        const isReady = lock.status === 'matured';
        const countdown = !isReady ? formatTimeRemaining(lock.unlockDate) : '';
        return (
        <TouchableOpacity key={lock.id} onPress={() => handlePress(lock.id)} style={styles.lockItem}>
          <View style={[styles.lockIconContainer, {
            backgroundColor: lock.status === 'matured' 
              ? 'rgba(0, 230, 118, 0.12)' 
              : 'rgba(123, 97, 255, 0.12)',
          }]}>
            {lock.status === 'matured' ? (
              <CheckCircle color={colors.success} size={24} />
            ) : (
              <Lock color={colors.secondary} size={24} />
            )}
          </View>
          <View style={styles.lockDetails}>
            <View style={styles.lockHeader}>
              <Text style={styles.lockAmount}>{lock.amount} XLM</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: lock.status === 'matured' 
                  ? 'rgba(0, 230, 118, 0.12)' 
                  : 'rgba(123, 97, 255, 0.12)',
              }]}>
                <Text style={[styles.statusText, {
                  color: lock.status === 'matured' 
                    ? colors.success 
                    : colors.secondary,
                }]}>
                  {lock.status === 'matured' ? 'Matured' : 'Locked'}
                </Text>
              </View>
            </View>
            <View style={styles.lockFooter}>
              <View style={styles.unlockDateContainer}>
                <Clock color={colors.textMuted} size={14} style={styles.clockIcon} />
                <Text style={styles.unlockDateText}>
                  {lock.status === 'matured' ? 'Unlocked' : `Unlocks ${new Date(lock.unlockDate).toLocaleDateString()}`}
                </Text>
              </View>
              {lock.status === 'matured' && (onUnlock || unlockDisabledReason) && (
                <TouchableOpacity 
                  style={[styles.unlockButton, !!unlockDisabledReason && styles.unlockButtonDisabled]} 
                  onPress={() => onUnlock?.(lock.id)}
                  disabled={!!unlockDisabledReason || !onUnlock}
                >
                  <Text style={[styles.unlockButtonText, !!unlockDisabledReason && styles.unlockButtonTextDisabled]}>
                    {unlockDisabledReason ? 'Unlock Unavailable' : 'Unlock'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {countdown ? (
              <Text style={styles.countdownText}>{countdown}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        );
      })}
      {onInfoPress && (
        <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
          <Info color={colors.primary} size={14} style={{ marginRight: 4 }} />
          <Text style={styles.infoButtonText}>How does locking work?</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  emptyIcon: {
    alignSelf: 'center',
    marginBottom: SIZES.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SIZES.sm,
  },
  emptyLearnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.md,
  },
  emptyLearnMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  lockItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: SIZES.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SIZES.sm,
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  lockDetails: {
    flex: 1,
  },
  lockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  lockAmount: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    marginRight: 4,
  },
  unlockDateText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  countdownText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  unlockButton: {
    backgroundColor: colors.success,
    paddingHorizontal: SIZES.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  unlockButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  unlockButtonDisabled: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unlockButtonTextDisabled: {
    color: colors.textMuted,
    fontSize: 12,
  },
  infoButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
  },
  infoButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
