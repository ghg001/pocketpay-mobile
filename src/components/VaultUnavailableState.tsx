import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { XCircle } from 'lucide-react-native';
import {
  VaultUnavailableReason,
  describeUnavailableReason,
} from '../utils/vaultAvailability';
import { Button } from './Button';

export interface VaultUnavailableStateProps {
  reasons: VaultUnavailableReason[];
  onNavigateToSettings?: () => void;
  onRetry?: () => void;
}

export const VaultUnavailableState: React.FC<VaultUnavailableStateProps> = ({
  reasons,
  onNavigateToSettings,
  onRetry,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const primaryReason = reasons[0] ?? 'sdk-not-ready';
  const primaryCopy = describeUnavailableReason(primaryReason);

  const showSettingsButton = reasons.includes('no-wallet') && onNavigateToSettings;
  const showRetryButton =
    (reasons.includes('feature-disabled') || reasons.includes('sdk-not-ready')) && onRetry;

  return (
    <View
      style={styles.unavailableCard}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Vault Unavailable. ${primaryCopy.title}. ${primaryCopy.message}`}
      accessibilityLiveRegion="polite"
    >
      <XCircle color={colors.error} size={48} testID="unavailable-icon" />
      <Text style={styles.unavailableTitle}>Vault Unavailable</Text>
      <Text style={styles.unavailableText}>
        The Soroban Savings Vault cannot be used right now because the required configuration or wallet is missing.
      </Text>

      {reasons.map((reason) => {
        const copy = describeUnavailableReason(reason);
        return (
          <View key={reason} style={styles.unavailableDetail} testID={`reason-detail-${reason}`}>
            <Text style={styles.unavailableDetailLabel}>{copy.title}</Text>
            <Text style={styles.unavailableDetailValue}>{copy.message}</Text>
            {copy.hint ? <Text style={styles.unavailableDetailHint}>{copy.hint}</Text> : null}
          </View>
        );
      })}


      {showSettingsButton ? (
        <Button
          title="Go to Settings"
          onPress={onNavigateToSettings}
          variant="primary"
          style={styles.actionButton}
        />
      ) : null}

      {showRetryButton && !showSettingsButton ? (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="secondary"
          style={styles.actionButton}
        />
      ) : null}

      <Text style={styles.unavailableDocsLink}>
        See docs/vault-ui-guidance.md for more information.
      </Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    unavailableCard: {
      backgroundColor: colors.surface,
      padding: SIZES.xl,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.error,
      marginBottom: SIZES.xl,
    },
    unavailableTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: SIZES.md,
      marginBottom: SIZES.sm,
    },
    unavailableText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: SIZES.lg,
    },
    unavailableDetail: {
      backgroundColor: 'rgba(255, 61, 0, 0.06)',
      padding: SIZES.md,
      borderRadius: RADIUS.md,
      width: '100%',
      marginBottom: SIZES.sm,
    },
    unavailableDetailLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    unavailableDetailValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    unavailableDetailHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    actionButton: {
      marginTop: SIZES.md,
      width: '100%',
      minHeight: 44,
    },
    unavailableDocsLink: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: SIZES.md,
    },
  });
