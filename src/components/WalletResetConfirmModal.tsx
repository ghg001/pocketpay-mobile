/**
 * WalletResetConfirmModal
 *
 * A destructive confirmation modal that requires the user to type "RESET"
 * before proceeding. Displays a clear breakdown of what data will be removed.
 *
 * Accessibility: all interactive elements carry accessibilityLabel / accessibilityRole.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { ShieldAlert, AlertTriangle, KeyRound, Users, Clock, Settings } from 'lucide-react-native';
import { Input } from './Input';
import { ConfirmModal } from './ConfirmModal';

interface WalletResetConfirmModalProps {
  visible: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The exact text the user must type to enable the destructive action. */
const CONFIRMATION_TEXT = 'confirm reset';

/** Items that will be permanently deleted, displayed as a bullet-point list. */
const DATA_TO_BE_REMOVED = [
  { icon: KeyRound, label: 'Wallet secret key', detail: 'Your Stellar secret key stored on this device' },
  { icon: Settings, label: 'App preferences', detail: 'Theme selection and app lock settings' },
  { icon: Users, label: 'Saved contacts', detail: 'Your address book entries' },
  { icon: Clock, label: 'Transaction history', detail: 'Cached payment activity' },
] as const;

export const WalletResetConfirmModal: React.FC<WalletResetConfirmModalProps> = ({
  visible,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (visible) {
      setTypedText('');
    }
  }, [visible]);

  const isConfirmed = typedText.trim().toLowerCase() === CONFIRMATION_TEXT;

  return (
    <ConfirmModal
      visible={visible}
      title="Reset Wallet"
      message=""
      confirmLabel="Delete Everything"
      cancelLabel="Cancel"
      destructive
      isLoading={isLoading}
      confirmDisabled={!isConfirmed}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {/* Warning message */}
      <View style={styles.warningBanner}>
        <AlertTriangle color={colors.warning} size={16} style={{ marginRight: SIZES.sm }} />
        <Text style={styles.warningBannerText}>
          This will permanently delete all wallet data from this device. Your funds on the Stellar network will remain, but you will need your secret key to access them again.
        </Text>
      </View>

      {/* Data that will be removed */}
      <Text style={styles.dataListTitle}>The following data will be permanently removed:</Text>
      {DATA_TO_BE_REMOVED.map(({ icon: Icon, label, detail }) => (
        <View key={label} style={styles.dataRow}>
          <View style={styles.dataIconContainer}>
            <Icon color={colors.error} size={16} />
          </View>
          <View style={styles.dataTextGroup}>
            <Text style={styles.dataLabel}>{label}</Text>
            <Text style={styles.dataDetail}>{detail}</Text>
          </View>
        </View>
      ))}

      {/* Typed confirmation */}
      <Input
        label={`Type "${CONFIRMATION_TEXT}" to confirm`}
        value={typedText}
        onChangeText={setTypedText}
        placeholder={CONFIRMATION_TEXT}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        editable={!isLoading}
        accessibilityLabel="Type confirm reset to confirm wallet deletion"
      />

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <ShieldAlert color={colors.warning} size={14} style={{ marginRight: SIZES.sm }} />
        <Text style={styles.disclaimerText}>
          This action is irreversible. Make sure you have backed up your secret key before proceeding — without it, any funds in your wallet will be unreachable.
        </Text>
      </View>
    </ConfirmModal>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.3)',
    borderRadius: RADIUS.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  warningBannerText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  dataListTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SIZES.sm,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    paddingLeft: SIZES.xs,
  },
  dataIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  dataTextGroup: {
    flex: 1,
  },
  dataLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  dataDetail: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.08)',
    borderRadius: RADIUS.sm,
    padding: SIZES.sm,
    marginTop: SIZES.xs,
  },
  disclaimerText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
