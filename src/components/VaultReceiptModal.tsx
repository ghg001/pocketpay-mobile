import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CircleCheck } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import { SIZES, RADIUS } from "../constants/theme";

interface VaultReceiptModalProps {
  visible: boolean;
  actionType: "deposit" | "withdraw" | "lock";
  amount: string;
  status: string;
  date: string;
  transactionHash?: string | null;
  onClose: () => void;
}

export const VaultReceiptModal = ({
  visible,
  actionType,
  amount,
  status,
  date,
  transactionHash,
  onClose,
}: VaultReceiptModalProps) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <CircleCheck color={colors.success} size={60} />

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Transaction Receipt
          </Text>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Action
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {actionType}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Amount
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {amount} XLM
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Status
            </Text>
            <Text style={{ color: colors.success }}>{status}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Date
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {date}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Tx Hash
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.hash, { color: colors.textPrimary }]}
            >
              {transactionHash ?? "Unavailable"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: SIZES.lg,
  },
  card: {
    width: "100%",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SIZES.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: SIZES.md,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  label: {
    fontWeight: "600",
  },
  value: {
    fontWeight: "600",
  },
  hash: {
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
  },
  button: {
    marginTop: SIZES.lg,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: RADIUS.md,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});