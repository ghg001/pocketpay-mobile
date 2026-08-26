/**
 * FundingStatusBanner
 *
 * Displays the account funding status and guides the user on next steps.
 *
 * States:
 *   - 'unknown':  haven't checked whether the account exists on network yet
 *   - 'checking':  in the process of checking account existence
 *   - 'unfunded':  account does not exist on the Stellar network yet
 *   - 'funded':    account exists on the network (may have zero or positive balance)
 *
 * Powered by Friendbot for Testnet funding.
 *
 * Accessibility: uses accessibilityRole="alert" when unfunded so screen
 * readers announce the state.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Zap, AlertTriangle, Loader2, CheckCircle, Info } from 'lucide-react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { AsyncActionButton } from './AsyncActionButton';
import type { FundingStatus } from '../types/balance';

export interface FundingStatusBannerProps {
  /** The current funding status of the account. */
  status: FundingStatus;
  /** Called when the user taps the fund button. */
  onFund?: () => void;
  /** True while a Friendbot funding request is in progress. */
  isFunding?: boolean;
  /** Error message from a failed funding attempt. */
  fundError?: string | null;
  /** Whether the testnet notice should be shown. */
  showTestnetNotice?: boolean;
}

export interface FundingStatusCopy {
  icon: React.ReactNode;
  title: string;
  message: string;
  /** Whether to show the fund button. */
  showFundButton: boolean;
  /** The fund button label. */
  fundLabel: string;
}

function getStatusCopy(
  status: FundingStatus,
  colors: ThemeColors
): FundingStatusCopy {
  switch (status) {
    case 'unknown':
      return {
        icon: <Info color={colors.textMuted} size={24} />,
        title: 'Checking account status…',
        message: 'Verifying whether your account exists on the Stellar network.',
        showFundButton: false,
        fundLabel: '',
      };
    case 'checking':
      return {
        icon: <Loader2 color={colors.primary} size={24} />,
        title: 'Checking account status…',
        message: 'Verifying whether your account exists on the Stellar network.',
        showFundButton: false,
        fundLabel: '',
      };
    case 'unfunded':
      return {
        icon: <Zap color={colors.warning} size={24} />,
        title: 'Unfunded Testnet Account',
        message:
          'This account has not been funded yet. Tap below to receive Testnet XLM from the Stellar Friendbot — free, no real value.',
        showFundButton: true,
        fundLabel: 'Fund with Friendbot',
      };
    case 'funded':
      return {
        icon: <CheckCircle color={colors.success} size={24} />,
        title: 'Account funded',
        message: 'Your account exists on the Stellar network and is ready to transact.',
        showFundButton: false,
        fundLabel: '',
      };
  }
}

export const FundingStatusBanner: React.FC<FundingStatusBannerProps> = ({
  status,
  onFund,
  isFunding = false,
  fundError,
  showTestnetNotice = true,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = useMemo(() => getStatusCopy(status, colors), [status, colors]);

  if (status === 'funded') {
    // Funded accounts don't need the banner unless we want to show testnet info
    if (!showTestnetNotice) return null;
    return (
      <View style={[styles.container, styles.fundedContainer]} accessibilityLabel="Account funded">
        <View style={styles.row}>
          {copy.icon}
          <View style={styles.textContainer}>
            <Text style={[styles.title, styles.fundedTitle]}>{copy.title}</Text>
            <Text style={[styles.message, styles.fundedMessage]}>{copy.message}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (status === 'unknown' || status === 'checking') {
    return (
      <View style={styles.container} accessibilityLabel={copy.title}>
        <View style={styles.row}>
          {status === 'checking' ? (
            <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: SIZES.sm }} />
          ) : (
            copy.icon
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.message}>{copy.message}</Text>
          </View>
        </View>
      </View>
    );
  }

  // Unfunded state — the main banner
  return (
    <View
      style={[styles.container, styles.unfundedContainer]}
      accessibilityRole="alert"
      accessibilityLabel={`${copy.title}. ${copy.message}`}
    >
      <View style={styles.unfundedHeader}>
        {copy.icon}
        <Text style={styles.unfundedTitle}>{copy.title}</Text>
      </View>

      <Text style={styles.unfundedMessage}>{copy.message}</Text>

      {fundError ? (
        <View style={styles.errorBox}>
          <AlertTriangle color={colors.error} size={16} style={{ marginRight: SIZES.xs }} />
          <Text style={styles.errorText}>{fundError}</Text>
        </View>
      ) : null}

      {copy.showFundButton && onFund ? (
        <AsyncActionButton
          title={copy.fundLabel}
          onPress={onFund}
          isLoading={isFunding}
          loadingText="Funding…"
          variant="secondary"
          style={styles.fundButton}
        />
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: SIZES.lg,
      borderRadius: RADIUS.lg,
      padding: SIZES.lg,
      borderWidth: 1,
    },
    unfundedContainer: {
      backgroundColor: colors.surface,
      borderColor: colors.warning,
    },
    fundedContainer: {
      backgroundColor: 'rgba(0, 230, 118, 0.06)',
      borderColor: 'rgba(0, 230, 118, 0.25)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    textContainer: {
      flex: 1,
      marginLeft: SIZES.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    message: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    fundedTitle: {
      color: colors.success,
    },
    fundedMessage: {
      color: colors.textSecondary,
    },
    unfundedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SIZES.sm,
    },
    unfundedTitle: {
      color: colors.warning,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: SIZES.sm,
    },
    unfundedMessage: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: SIZES.md,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 61, 0, 0.1)',
      borderRadius: RADIUS.sm,
      padding: SIZES.sm,
      marginBottom: SIZES.md,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      flex: 1,
    },
    fundButton: {
      marginTop: SIZES.xs,
    },
  });
