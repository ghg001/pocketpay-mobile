import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import {
  classifyVaultError,
  describeVaultError,
  type VaultErrorCode,
  type VaultRecoveryGuidance,
} from '../utils/vaultErrors';
import { AlertTriangle, WifiOff, XCircle } from 'lucide-react-native';

export interface VaultErrorBannerProps {
  /** The raw error caught from a vault action. */
  error?: unknown | null;
  /** Pre-classified guidance — skips auto-detection when provided. */
  guidance?: VaultRecoveryGuidance | null;
  /** Pre-classified error code — skips auto-detection when provided. */
  errorCode?: VaultErrorCode;
  /** Called when the user taps "Try Again". */
  onRetry?: () => void;
  /** Called when the user taps "Go Back" or dismiss. */
  onDismiss?: () => void;
}

/**
 * Inline error banner for vault action failures.
 *
 * Displays a user-friendly title, a short explanation, and
 * actionable recovery buttons based on the vault error category.
 * Follows the same design language as PaymentErrorBanner but
 * uses vault-specific error classification.
 */
export const VaultErrorBanner: React.FC<VaultErrorBannerProps> = ({
  error,
  guidance: preClassifiedGuidance,
  errorCode,
  onRetry,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const guidance: VaultRecoveryGuidance = preClassifiedGuidance
    ?? (errorCode
      ? describeVaultError(errorCode)
      : error
        ? classifyVaultError(error)
        : {
            title: 'Unknown Error',
            message: 'An unexpected error occurred with this vault action.',
            action: 'Please try again.',
            canRetry: true,
            shouldNavigateBack: false,
          });

  const isNetworkError = guidance.title === 'Network Problem';

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Vault error: ${guidance.title}. ${guidance.message}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.iconRow}>
        {isNetworkError ? (
          <WifiOff color={colors.warning} size={22} />
        ) : (
          <AlertTriangle color={colors.error} size={22} />
        )}
        <Text style={styles.title}>{guidance.title}</Text>
      </View>

      <Text style={styles.message}>{guidance.message}</Text>

      <View style={styles.actionBox}>
        <XCircle color={colors.textSecondary} size={16} style={{ marginTop: 2 }} />
        <Text style={styles.actionText}>{guidance.action}</Text>
      </View>

      <View style={styles.buttonRow}>
        {guidance.canRetry && onRetry && (
          <Button
            title="Try Again"
            variant="primary"
            onPress={onRetry}
            style={styles.button}
          />
        )}
        {onDismiss && (
          <Button
            title={guidance.shouldNavigateBack ? 'Go Back' : 'Dismiss'}
            variant={guidance.canRetry ? 'outline' : 'primary'}
            onPress={onDismiss}
            style={styles.button}
          />
        )}
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
      borderColor: colors.error,
      padding: SIZES.lg,
      marginBottom: SIZES.lg,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SIZES.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '600',
      marginLeft: SIZES.sm,
    },
    message: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: SIZES.md,
    },
    actionBox: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceLight,
      borderRadius: RADIUS.sm,
      padding: SIZES.md,
      marginBottom: SIZES.md,
    },
    actionText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      marginLeft: SIZES.sm,
      flex: 1,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: SIZES.sm,
    },
    button: {
      flex: 1,
    },
  });
