import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { PiggyBank, Network, ShieldAlert, Info } from 'lucide-react-native';

interface VaultIntroModalProps {
  visible: boolean;
  onContinue: () => void;
}

export const VaultIntroModal: React.FC<VaultIntroModalProps> = ({ visible, onContinue }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <PiggyBank color={colors.primary} size={36} />
          </View>

          <Text style={styles.title}>Welcome to the Savings Vault</Text>
          <Text style={styles.subtitle}>
            A quick overview before you deposit, withdraw, or lock funds.
          </Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                <PiggyBank color={colors.primary} size={18} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>What the vault does</Text>
                <Text style={styles.pointBody}>
                  The vault lets you set aside XLM separately from your main wallet balance, with
                  support for depositing, withdrawing, and time-locking funds.
                </Text>
              </View>
            </View>

            <View style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: 'rgba(255, 196, 0, 0.12)' }]}>
                <Network color={colors.warning} size={18} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>Testnet only</Text>
                <Text style={styles.pointBody}>
                  The vault currently runs against the Stellar Testnet. Balances have no real
                  monetary value and the contract may be reset or redeployed without notice.
                </Text>
              </View>
            </View>

            <View style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: 'rgba(123, 97, 255, 0.12)' }]}>
                <ShieldAlert color={colors.secondary} size={18} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>Current limitations</Text>
                <Text style={styles.pointBody}>
                  If no contract is configured, the vault runs in mock mode and no funds move
                  on-chain. Time-locking is not yet implemented. This is not a production custody
                  solution — do not deposit funds you cannot afford to lose.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.disclaimer}>
            <Info color={colors.textMuted} size={14} style={{ marginRight: 6 }} />
            <Text style={styles.disclaimerText}>
              You can revisit this explanation anytime from the info icon on the vault screen.
            </Text>
          </View>

          <Button title="Continue to Vault" onPress={onContinue} style={styles.continueButton} />
        </View>
      </View>
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
      maxWidth: 420,
      maxHeight: '85%',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      padding: SIZES.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconContainer: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(0, 229, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SIZES.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: SIZES.xs,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: SIZES.lg,
    },
    body: {
      marginBottom: SIZES.md,
    },
    point: {
      flexDirection: 'row',
      marginBottom: SIZES.md,
    },
    pointIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SIZES.sm,
    },
    pointText: {
      flex: 1,
    },
    pointTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    pointBody: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    disclaimer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(160, 170, 191, 0.08)',
      borderRadius: RADIUS.sm,
      padding: SIZES.sm,
      marginBottom: SIZES.lg,
    },
    disclaimerText: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      flex: 1,
    },
    continueButton: {
      width: '100%',
    },
  });
