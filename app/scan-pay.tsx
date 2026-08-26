import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SIZES, RADIUS, ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useWalletStore } from "@/store/walletStore";
import {
  useScanPayReview,
  describeScanPay,
} from "@/features/payments";

/**
 * QR scan -> payment review screen (issue #407).
 *
 * Flow: paste/scan a payload -> parse + validate -> show a review of the
 * parsed destination/amount/asset/memo -> the user may CANCEL (no payment
 * intent is ever created or signed) or CONFIRM (which would hand off to
 * the existing send flow in a real build; here we only navigate intent).
 *
 * We deliberately do NOT submit or sign from this screen.
 */
export default function ScanPayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { publicKey, balance } = useWalletStore();

  const {
    review,
    description,
    stage,
    onScan,
    onCancel,
    onConfirm,
    reset,
  } = useScanPayReview({ ownPublicKey: publicKey, balance });

  const [rawInput, setRawInput] = useState("");

  const handleParse = () => {
    onScan(rawInput);
  };

  const handleCancel = () => {
    onCancel();
    setRawInput("");
  };

  const handleConfirm = () => {
    if (!review || !review.isValid) return;
    // In production this hands off to app/send.tsx with the reviewed
    // fields. We never sign here. For now surface intent + reset.
    Alert.alert(
      "Review confirmed",
      "This is where the reviewed payment would be handed to the send flow. No transaction was signed.",
      [{ text: "OK", onPress: () => { reset(); setRawInput(""); } }],
    );
    onConfirm();
  };

  const showReview = stage === "review" && review;
  const desc = description as ReturnType<typeof describeScanPay> | null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Scan to Pay"
        subtitle="Review the payment before you continue. You can cancel at any time."
      />

      <View style={styles.inputRow}>
        <Text style={styles.label}>Scanned QR payload</Text>
        <Text style={styles.mono} selectable>
          {rawInput || "(paste a scanned value to begin)"}
        </Text>
        <View style={styles.actions}>
          <Button
            title="Parse scan"
            onPress={handleParse}
            disabled={!rawInput.trim()}
          />
          <Button
            title="Clear"
            variant="secondary"
            onPress={() => { setRawInput(""); reset(); }}
          />
        </View>
      </View>

      {showReview && (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>
            {review!.isPaymentRequest ? "Payment request" : "Address-only payment"}
          </Text>

          <ReviewRow label="Destination" value={desc?.destination ?? "—"} styles={styles} />
          <ReviewRow label="Amount" value={desc?.amount ?? "—"} styles={styles} />
          <ReviewRow label="Asset" value={desc?.asset ?? "—"} styles={styles} />
          <ReviewRow label="Memo" value={desc?.memo ?? "—"} styles={styles} />

          {review!.errors.length > 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>This scan can&apos;t be used yet:</Text>
              {review!.errors.map((e, i) => (
                <Text key={`${e.field}-${i}`} style={styles.errorItem}>
                  • {e.message}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.okNote}>
              All fields validated. You can confirm or cancel.
            </Text>
          )}

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={handleCancel}
            />
            <Button
              title="Confirm & continue"
              onPress={handleConfirm}
              disabled={!review!.isValid}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function ReviewRow({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: SIZES.xl, paddingBottom: SIZES.xxl },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: SIZES.xs,
    },
    mono: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: "monospace",
      backgroundColor: colors.surface,
      padding: SIZES.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: SIZES.md,
    },
    inputRow: { marginBottom: SIZES.lg },
    reviewCard: {
      backgroundColor: colors.surface,
      padding: SIZES.lg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: SIZES.md,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: SIZES.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLabel: { color: colors.textSecondary, fontSize: 14, flex: 0.4 },
    rowValue: { color: colors.textPrimary, fontSize: 14, flex: 0.6, textAlign: "right" },
    errorBox: {
      marginTop: SIZES.md,
      backgroundColor: colors.surface,
      padding: SIZES.md,
      borderRadius: RADIUS.md,
    },
    errorTitle: { color: colors.error, fontSize: 14, fontWeight: "600", marginBottom: SIZES.xs },
    errorItem: { color: colors.error, fontSize: 13, marginBottom: 2 },
    okNote: { color: colors.success ?? colors.primary, fontSize: 13, marginTop: SIZES.md },
  });
