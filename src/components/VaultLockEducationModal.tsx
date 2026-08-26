import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SIZES, RADIUS, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { Lock, Clock, AlertCircle, X, ArrowRight, CheckCircle, Wallet } from 'lucide-react-native';
import { formatTimeRemaining } from '../utils/lockTime';

interface VaultLockEducationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VaultLockEducationModal: React.FC<VaultLockEducationModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Lock color={colors.secondary} size={36} />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <X color={colors.textMuted} size={22} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Understanding Locked Funds</Text>
          <Text style={styles.subtitle}>
            Locking sets your XLM aside for a set period. Here's how it works.
          </Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ── Visual timeline ─────────────────────────────────── */}
            <View style={styles.timeline}>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, { backgroundColor: colors.secondary }]}>
                  <Lock color={colors.background} size={14} />
                </View>
                <Text style={styles.timelineLabel}>You lock{"\n"}your funds</Text>
              </View>
              <View style={styles.timelineArrow}>
                <ArrowRight color={colors.textMuted} size={16} />
              </View>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, { backgroundColor: colors.warning }]}>
                  <Clock color={colors.background} size={14} />
                </View>
                <Text style={styles.timelineLabel}>Wait for the{"\n"}unlock date</Text>
              </View>
              <View style={styles.timelineArrow}>
                <ArrowRight color={colors.textMuted} size={16} />
              </View>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]}>
                  <Wallet color={colors.background} size={14} />
                </View>
                <Text style={styles.timelineLabel}>Withdraw{"\n"}anytime</Text>
              </View>
            </View>



            {/* ── Education points ────────────────────────────────── */}
            <View style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: 'rgba(123, 97, 255, 0.12)' }]}>
                <Lock color={colors.secondary} size={18} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>Why are funds locked?</Text>
                <Text style={styles.pointBody}>
                  When you lock funds in the vault, they are set aside to help you save and avoid accidental spending. The smart contract holds your funds securely until the designated lock duration completes.
                </Text>
              </View>
            </View>

            <View style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
                <CheckCircle color={colors.success} size={18} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>When do funds become withdrawable?</Text>
                <Text style={styles.pointBody}>
                  Funds become eligible for withdrawal as soon as the unlock date passes based on the contract's schedule. Once matured, a "Ready" badge appears and you can move them back to your wallet at any time — there is no time limit or deadline to claim them.
                </Text>
              </View>
            </View>

            <View style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                <Wallet color={colors.primary} size={18} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>How is unlock timing determined?</Text>
                <Text style={styles.pointBody}>
                  Unlock timing is set when you create a lock (for example, 30 days) and is tracked on-chain by the smart contract's network time. Multiple independent locks can be created, each with its own amount and unlock schedule.
                </Text>
              </View>
            </View>

            <View style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: 'rgba(255, 196, 0, 0.12)' }]}>
                <AlertCircle color={colors.warning} size={18} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>Testnet preview notice</Text>
                <Text style={styles.pointBody}>
                  This feature currently operates on the Stellar Testnet. Locked amounts are tracked for demonstration and testing — no real funds are involved.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Button title="Got it" onPress={onClose} style={styles.continueButton} />
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
      maxWidth: 400,
      maxHeight: '85%',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      padding: SIZES.xl,
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
      backgroundColor: 'rgba(123, 97, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
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
    // ── Visual timeline ──────────────────────────────────────────
    timeline: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      backgroundColor: 'rgba(123, 97, 255, 0.06)',
      borderRadius: RADIUS.lg,
      paddingVertical: SIZES.lg,
      paddingHorizontal: SIZES.sm,
      marginBottom: SIZES.lg,
    },
    timelineStep: {
      alignItems: 'center',
      flex: 1,
    },
    timelineDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SIZES.xs,
    },
    timelineLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 15,
    },
    timelineArrow: {
      paddingTop: 8,
      paddingHorizontal: 2,
    },

    // ── Education points ─────────────────────────────────────────
    point: {
      flexDirection: 'row',
      marginBottom: SIZES.lg,
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
      marginBottom: 4,
    },
    pointBody: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    continueButton: {
      width: '100%',
    },
  });
