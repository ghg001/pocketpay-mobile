import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { X, AlertTriangle } from 'lucide-react-native';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * Forces the busy state. Optional: an async `onConfirm` is tracked automatically,
   * so callers only need this when the pending state lives outside the modal.
   */
  isLoading?: boolean;
  confirmDisabled?: boolean;
  /** Explains to assistive tech why confirm is unavailable while `confirmDisabled` is set. */
  confirmDisabledHint?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  /** May return a promise; the modal stays busy (and uncancellable) until it settles. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  isLoading = false,
  confirmDisabled = false,
  confirmDisabledHint,
  icon,
  children,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Tracks an async `onConfirm` so every caller gets the same spinner/disabled
  // treatment without re-implementing the pending state at each call site.
  const [isConfirming, setIsConfirming] = useState(false);
  const isConfirmingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const busy = isLoading || isConfirming;
  const canConfirm = !confirmDisabled && !busy;

  const handleConfirm = useCallback(async () => {
    // The ref guard closes the window between two taps landing before React
    // re-renders the button as disabled.
    if (confirmDisabled || isLoading || isConfirmingRef.current) return;

    isConfirmingRef.current = true;
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      isConfirmingRef.current = false;
      if (isMountedRef.current) setIsConfirming(false);
    }
  }, [confirmDisabled, isLoading, onConfirm]);

  const handleCancel = useCallback(() => {
    if (busy) return;
    onCancel();
  }, [busy, onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            {icon ? (
              <View style={styles.iconContainer}>{icon}</View>
            ) : destructive ? (
              <View style={[styles.iconContainer, styles.destructiveIconBg]}>
                <AlertTriangle color={colors.error} size={36} />
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              disabled={busy}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={`Close, ${cancelLabel}`}
              accessibilityState={{ disabled: busy }}
            >
              <X color={colors.textMuted} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {children ? <View style={styles.customContent}>{children}</View> : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={busy}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              accessibilityState={{ disabled: busy }}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.confirmButton,
                destructive
                  ? { backgroundColor: canConfirm ? colors.error : colors.surfaceLight }
                  : { backgroundColor: canConfirm ? colors.primary : colors.surfaceLight },
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: !canConfirm, busy }}
              accessibilityHint={
                confirmDisabled
                  ? confirmDisabledHint ??
                    'Disabled until the confirmation requirement below is met'
                  : undefined
              }
            >
              {busy ? (
                <ActivityIndicator
                  color={canConfirm ? colors.background : colors.textMuted}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.confirmButtonText,
                    { color: canConfirm ? colors.background : colors.textMuted },
                  ]}
                >
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SIZES.lg,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      paddingTop: SIZES.xl,
      paddingHorizontal: SIZES.xl,
      paddingBottom: SIZES.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SIZES.md,
      position: 'relative',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    destructiveIconBg: {
      backgroundColor: 'rgba(244, 67, 54, 0.12)',
    },
    closeButton: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
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
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: SIZES.lg,
    },
    customContent: {
      marginBottom: SIZES.xs,
    },
    scrollBody: {
      flexShrink: 1,
    },
    scrollBodyContent: {
      flexGrow: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: SIZES.sm,
      marginTop: SIZES.lg,
    },
    actionButton: {
      flex: 1,
      height: 50,
      borderRadius: RADIUS.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surfaceLight,
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    confirmButton: {},
    confirmButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
  });
