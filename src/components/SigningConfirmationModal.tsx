import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { ShieldAlert, X } from "lucide-react-native";
import { SIZES, RADIUS, ThemeColors } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { AsyncActionButton } from "./AsyncActionButton";

interface SigningConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  recipient: string;
  amount: string;
  memo?: string;
  network?: string;
  isSubmitting: boolean;
}

export function SigningConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  recipient,
  amount,
  memo,
  network = "Stellar Network",
  isSubmitting,
}: SigningConfirmationModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Confirm Transaction</Text>
            <TouchableOpacity onPress={onCancel} disabled={isSubmitting}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.warningBox}>
              <ShieldAlert size={24} color={colors.warning} />
              <Text style={styles.warningText}>
                You are about to sign a transaction with your secure key. This action cannot be reversed.
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network</Text>
              <Text style={styles.detailValue}>{network}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValueAmount}>{amount} XLM</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recipient</Text>
              <Text style={styles.detailValue}>{recipient}</Text>
            </View>

            {memo ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Memo</Text>
                <Text style={styles.detailValue}>{memo}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <AsyncActionButton
              title="Sign & Submit"
              onPress={onConfirm}
              isLoading={isSubmitting}
              loadingText="Signing..."
              style={styles.confirmButton}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      maxHeight: "90%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SIZES.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    content: {
      padding: SIZES.lg,
    },
    warningBox: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: SIZES.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.warning,
      marginBottom: SIZES.xl,
      gap: SIZES.sm,
      alignItems: "center",
    },
    warningText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: SIZES.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    detailValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
      textAlign: "right",
      marginLeft: SIZES.lg,
    },
    detailValueAmount: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    footer: {
      flexDirection: "row",
      padding: SIZES.lg,
      gap: SIZES.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: SIZES.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    confirmButton: {
      flex: 2,
    },
  });
