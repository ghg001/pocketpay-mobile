import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PiggyBank, Lock, ArrowRightCircle, HelpCircle, Sparkles } from 'lucide-react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { EmptyState } from './EmptyState';
import { AsyncActionButton } from './AsyncActionButton';

export interface VaultEmptyStateProps {
  isConfigured: boolean;
  isLoadingBalance: boolean;
  isLoadingLocks: boolean;
  onDeposit: () => void;
  onLearnMore: () => void;
  isSubmittingDeposit?: boolean;
  /** Honest-feature-readiness override for the warning tone of the secondary message. True shows a stronger
   *  Testnet / mock caveat sentence rather than a "safe" savings pitch. */
  isMock?: boolean;
}

export const VaultEmptyState: React.FC<VaultEmptyStateProps> = ({
  isConfigured,
  isLoadingBalance,
  isLoadingLocks,
  onDeposit,
  onLearnMore,
  isSubmittingDeposit = false,
  isMock = true,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoadingBalance || isLoadingLocks) {
    return (
      <EmptyState
        icon={<PiggyBank color={colors.textMuted} size={48} />}
        title="Loading your vault"
        message="Reading balance and any active locks. This should only take a moment."
      />
    );
  }

  const title = isConfigured
    ? 'Your vault is ready to use'
    : 'Set aside XLM in the vault';

  const message = isConfigured
    ? "Deposit funds from your wallet to start saving, or create a time-lock to keep funds untouched until a future date."
    : "Deposit funds from your wallet to start saving. When a contract isn't configured, all actions run in preview mode — no real on-chain transactions are submitted yet.";

  const featureNote = isMock
    ? 'Currently in preview: Testnet balances and mock locks only.'
    : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapperOuter}>
        <View style={styles.iconRing}>
          <PiggyBank color={colors.primary} size={40} />
        </View>
        <View style={[styles.badge, isConfigured ? styles.badgeReal : styles.badgeMock]}>
          {isConfigured ? (
            <Sparkles color={colors.primary} size={14} />
          ) : (
            <HelpCircle color={colors.warning} size={14} />
          )}
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
            <ArrowRightCircle color={colors.primary} size={18} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Deposit from your wallet</Text>
            <Text style={styles.featureBody}>
              Move XLM into the vault whenever you want to separate savings from spending.
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: 'rgba(123, 97, 255, 0.12)' }]}>
            <Lock color={colors.secondary} size={18} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Lock funds for later</Text>
            <Text style={styles.featureBody}>
              Create a time-lock and the funds cannot be withdrawn until the unlock date has passed.
            </Text>
          </View>
        </View>
      </View>

      {featureNote ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>{featureNote}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AsyncActionButton
          title="Make your first deposit"
          onPress={onDeposit}
          isLoading={isSubmittingDeposit}
          loadingText="Preparing deposit…"
          style={styles.primaryButton}
        />
        <AsyncActionButton
          title="Learn more about the vault"
          variant="outline"
          onPress={onLearnMore}
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SIZES.xl,
      alignItems: 'center',
      marginBottom: SIZES.lg,
    },
    iconWrapperOuter: {
      position: 'relative',
      marginBottom: SIZES.lg,
    },
    iconRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 229, 255, 0.10)',
      borderWidth: 2,
      borderColor: 'rgba(0, 229, 255, 0.20)',
    },
    badge: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    badgeReal: {
      backgroundColor: 'rgba(0, 230, 118, 0.15)',
    },
    badgeMock: {
      backgroundColor: 'rgba(255, 196, 0, 0.18)',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: SIZES.sm,
    },
    message: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: SIZES.lg,
      paddingHorizontal: SIZES.xs,
    },
    features: {
      width: '100%',
      marginBottom: SIZES.lg,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: SIZES.sm,
    },
    featureIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SIZES.md,
      marginTop: 2,
    },
    featureText: { flex: 1 },
    featureTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    featureBody: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    note: {
      width: '100%',
      backgroundColor: 'rgba(255, 196, 0, 0.1)',
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.sm,
      borderRadius: RADIUS.md,
      marginBottom: SIZES.lg,
    },
    noteText: {
      color: colors.warning,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
    actions: {
      width: '100%',
    },
    primaryButton: {
      width: '100%',
      marginBottom: SIZES.sm,
    },
    secondaryButton: {
      width: '100%',
    },
  });
