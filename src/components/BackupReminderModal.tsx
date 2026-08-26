import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { ShieldAlert, CheckSquare, Square } from 'lucide-react-native';

interface BackupReminderModalProps {
  visible: boolean;
  onAcknowledge: () => void;
}

/**
 * Post-creation backup reminder.
 *
 * Shown once after a wallet is created, on top of the home screen. The modal is
 * intentionally non-dismissable (no overlay tap, no Android back) so the user has
 * to make an explicit acknowledgement — the persisted flag in `walletStore` means
 * an unacknowledged reminder comes back on the next launch.
 *
 * The modal deliberately shows no key material: the secret key is revealed only
 * on the creation screen, behind an explicit reveal, and is never repeated here.
 */
export const BackupReminderModal: React.FC<BackupReminderModalProps> = ({
  visible,
  onAcknowledge,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isChecked, setIsChecked] = useState(false);

  // Reset the checkbox whenever the reminder closes, so a reminder that reappears
  // (e.g. after an app restart that left it unacknowledged) starts unchecked.
  useEffect(() => {
    if (!visible) setIsChecked(false);
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      // Non-dismissable by design: acknowledgement is the only way out.
      onRequestClose={() => {}}
      testID="backup-reminder-modal"
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.iconContainer}>
              <ShieldAlert color={colors.warning} size={48} />
            </View>

            <Text style={styles.title} accessibilityRole="header">
              Secure Your Wallet
            </Text>

            <Text style={styles.description}>
              Your secret key is the <Text style={styles.boldText}>ONLY</Text> way to access your
              wallet and recover your funds.
            </Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {'•'} PocketPay does not store your secret key on any servers.{'\n'}
                {'•'} If you lose your secret key, your funds are lost forever.{'\n'}
                {'•'} Do not share your secret key with anyone, including PocketPay support.
              </Text>
            </View>

            <Pressable
              style={styles.checkboxContainer}
              onPress={() => setIsChecked((checked) => !checked)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              accessibilityLabel="I have securely backed up my secret key"
              testID="backup-reminder-checkbox"
            >
              {isChecked ? (
                <CheckSquare color={colors.primary} size={24} style={styles.checkbox} />
              ) : (
                <Square color={colors.textSecondary} size={24} style={styles.checkbox} />
              )}
              <Text style={styles.checkboxLabel}>
                I confirm that I have securely backed up my secret key and understand its
                importance.
              </Text>
            </Pressable>

            <Button
              title="I Understand, Continue"
              disabled={!isChecked}
              onPress={onAcknowledge}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(7, 9, 17, 0.85)',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SIZES.md,
    },
    contentContainer: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SIZES.xl,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    iconContainer: {
      backgroundColor: 'rgba(255, 196, 0, 0.1)',
      padding: SIZES.md,
      borderRadius: RADIUS.round,
      marginBottom: SIZES.md,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: SIZES.md,
      textAlign: 'center',
    },
    description: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SIZES.md,
    },
    boldText: {
      color: colors.warning,
      fontWeight: 'bold',
    },
    warningBox: {
      backgroundColor: colors.surfaceLight,
      borderRadius: RADIUS.md,
      padding: SIZES.md,
      width: '100%',
      marginBottom: SIZES.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    warningText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: '100%',
      marginBottom: SIZES.xl,
    },
    checkbox: {
      marginRight: SIZES.sm,
      marginTop: 2,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    button: {
      width: '100%',
      height: 48,
    },
  });
