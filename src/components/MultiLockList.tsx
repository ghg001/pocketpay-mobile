import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Lock, Unlock, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { COLORS, SIZES, RADIUS } from '../constants/theme';
import { VaultLock, LockStatus } from '../types/vault';
import { Button } from './Button';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface MultiLockListProps {
  /** Array of vault locks to display. */
  locks: VaultLock[];
  /** Whether locks are currently being loaded. */
  isLoading?: boolean;
  /** Error message if loading failed. */
  error?: string | null;
  /** Called when the user taps the withdraw action on a matured lock. */
  onWithdraw?: (lock: VaultLock) => void;
  /** Called to retry loading after an error. */
  onRetry?: () => void;
  /** Whether a withdraw action is currently in progress (disables buttons). */
  isWithdrawing?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<LockStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  locked: {
    icon: <Clock size={16} color={COLORS.warning} />,
    label: 'Locked',
    color: COLORS.warning,
    bg: 'rgba(255, 196, 0, 0.1)',
  },
  matured: {
    icon: <Unlock size={16} color={COLORS.success} />,
    label: 'Matured',
    color: COLORS.success,
    bg: 'rgba(0, 230, 118, 0.1)',
  },
  withdrawn: {
    icon: <CheckCircle2 size={16} color={COLORS.textMuted} />,
    label: 'Withdrawn',
    color: COLORS.textMuted,
    bg: 'rgba(99, 112, 135, 0.1)',
  },
};

/** Format an ISO date string for display. */
const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const LockRow: React.FC<{
  lock: VaultLock;
  onWithdraw?: (lock: VaultLock) => void;
  isWithdrawing?: boolean;
}> = ({ lock, onWithdraw, isWithdrawing }) => {
  const cfg = STATUS_CONFIG[lock.status];

  return (
    <View style={styles.lockRow}>
      {/* Icon + Info */}
      <View style={styles.lockInfo}>
        <View style={[styles.lockIconContainer, { backgroundColor: cfg.bg }]}>
          <Lock color={cfg.color} size={20} />
        </View>
        <View style={styles.lockDetails}>
          <Text style={styles.lockAmount}>{lock.amount} XLM</Text>
          <Text style={styles.lockDate}>Unlocks {formatDate(lock.unlockDate)}</Text>
        </View>
      </View>

      {/* Status badge + action */}
      <View style={styles.lockActions}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          {cfg.icon}
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        {lock.status === 'matured' && onWithdraw && (
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => onWithdraw(lock)}
            disabled={isWithdrawing}
            activeOpacity={0.7}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const MultiLockList: React.FC<MultiLockListProps> = ({
  locks,
  isLoading = false,
  error = null,
  onWithdraw,
  onRetry,
  isWithdrawing = false,
}) => {
  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Your Locks</Text>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading locks…</Text>
        </View>
      </View>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Your Locks</Text>
        <View style={styles.stateContainer}>
          <AlertCircle color={COLORS.error} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          {onRetry && (
            <Button
              title="Retry"
              variant="outline"
              onPress={onRetry}
              style={styles.retryButton}
            />
          )}
        </View>
      </View>
    );
  }

  /* ---- Empty state ---- */
  if (locks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Your Locks</Text>
        <View style={styles.stateContainer}>
          <Lock color={COLORS.textMuted} size={32} />
          <Text style={styles.emptyTitle}>No Locks Yet</Text>
          <Text style={styles.emptySubtitle}>
            Deposit XLM into the vault to create a time-locked position.
          </Text>
        </View>
      </View>
    );
  }

  /* ---- Lock list ---- */
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Locks</Text>
      {locks.map((lock, index) => (
        <View
          key={lock.id}
          style={[
            styles.lockCard,
            index === locks.length - 1 && styles.lockCardLast,
          ]}
        >
          <LockRow lock={lock} onWithdraw={onWithdraw} isWithdrawing={isWithdrawing} />
        </View>
      ))}
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },

  /* ---- State containers ---- */
  stateContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.xl,
    alignItems: 'center',
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SIZES.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.md,
  },
  retryButton: {
    marginTop: SIZES.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: SIZES.md,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SIZES.xs,
    lineHeight: 20,
  },

  /* ---- Lock cards ---- */
  lockCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  lockCardLast: {
    marginBottom: 0,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.md,
  },
  lockIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  lockDetails: {
    flex: 1,
  },
  lockAmount: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  lockDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  /* ---- Status & actions ---- */
  lockActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  withdrawButton: {
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  withdrawButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '700',
  },
});
