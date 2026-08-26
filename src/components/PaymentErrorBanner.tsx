import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, RADIUS } from '../constants/theme';
import { Button } from './Button';
import { classifyPaymentError, type RecoveryGuidance } from '../utils/paymentErrors';
import { AlertTriangle, WifiOff, XCircle } from 'lucide-react-native';

interface PaymentErrorBannerProps {
  /** The raw error caught from the send flow. */
  error: Error | null;
  /** Called when the user taps "Try Again". */
  onRetry?: () => void;
  /** Called when the user taps "Go Back" or dismiss. */
  onDismiss?: () => void;
}

/**
 * Inline error banner that replaces raw Alert.alert dialogs.
 *
 * Displays a user-friendly title, a short explanation, and
 * actionable recovery buttons based on the error category.
 */
export const PaymentErrorBanner: React.FC<PaymentErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  const guidance: RecoveryGuidance = error ? classifyPaymentError(error) : {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again.',
    canRetry: true,
    shouldNavigateBack: false,
  };

  const isNetworkError = guidance.title === 'Network Error';

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        {isNetworkError ? (
          <WifiOff color={COLORS.warning} size={22} />
        ) : (
          <AlertTriangle color={COLORS.error} size={22} />
        )}
        <Text style={styles.title}>{guidance.title}</Text>
      </View>

      <Text style={styles.message}>{guidance.message}</Text>

      <View style={styles.actionBox}>
        <XCircle color={COLORS.textSecondary} size={16} style={{ marginTop: 2 }} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SIZES.md,
  },
  actionBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.sm,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  actionText: {
    color: COLORS.textSecondary,
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
