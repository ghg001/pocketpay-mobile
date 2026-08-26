import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Share, TouchableOpacity } from "react-native";
import { Button } from "../src/components/Button";
import { FormField } from "../src/components/FormField";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { SIZES, RADIUS, ThemeColors } from "../src/constants/theme";
import { useTheme } from "../src/hooks/useTheme";
import { useWalletStore } from "../src/store/walletStore";
import { validateAmount, validateMemo } from "../src/utils/validation";
import { buildReceivePayload, isPaymentRequestPayload } from "../src/features/receive";
import QRCode from "react-native-qrcode-svg";
import { useCopyToClipboard } from "../src/utils/clipboard";
import { useNetworkState } from "../src/hooks/useNetworkState";
import { NetworkStatusBanner } from "../src/components/NetworkStatusBanner";

export default function ReceiveScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { publicKey, error } = useWalletStore();
  const { copy } = useCopyToClipboard();
  const { state: networkState, retry } = useNetworkState({ error });

  const [showRequestFields, setShowRequestFields] = useState(false);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  // Requesting a specific amount has no sender balance to validate against
  // (unlike send.tsx) - the requester isn't the one spending, so
  // validateAmount is called with no balance argument.
  const amountError = amount.trim() ? validateAmount(amount) ?? undefined : undefined;
  const memoError = memo.trim() ? validateMemo(memo) ?? undefined : undefined;

  const payload = useMemo(() => {
    if (!publicKey) return "";
    return buildReceivePayload({
      destination: publicKey,
      amount: amountError ? undefined : amount,
      memo: memoError ? undefined : memo,
    });
  }, [publicKey, amount, amountError, memo, memoError]);

  const isRequestPayload = isPaymentRequestPayload(payload);

  const handleCopyAddress = async () => {
    if (publicKey) {
      await copy(publicKey, 'address');
    }
  };

  // Share the receive payload (address or payment request) via OS share sheet
  const handleShare = async () => {
    if (!payload) return;
    try {
      await Share.share({
        message: payload,
        title: isRequestPayload ? "Payment Request" : "My Stellar Address",
      });
    } catch (error) {
      console.error("Error sharing receive payload:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Receive XLM"
        subtitle="Show this QR code to receive payments on the Stellar Testnet."
      />

      <NetworkStatusBanner
        state={networkState}
        onRetry={retry}
      />

      <View style={styles.qrContainer}>
        {publicKey ? (
          <QRCode
            value={payload}
            size={250}
            color={colors.background}
            backgroundColor={colors.textPrimary}
          />
        ) : (
          <Text style={{ color: colors.textMuted }}>No public key found</Text>
        )}
      </View>

      {isRequestPayload && (
        <Text style={styles.requestBadge}>Requesting a specific amount</Text>
      )}

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Your Public Key</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressText} selectable>
            {publicKey}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setShowRequestFields((prev) => !prev)}
        accessibilityRole="button"
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {showRequestFields ? "Hide payment request details" : "Request a specific amount"}
        </Text>
      </TouchableOpacity>

      {showRequestFields && (
        <View style={styles.requestFields}>
          <FormField
            label="Amount (XLM, optional)"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            error={amountError}
            keyboardType="decimal-pad"
          />
          <FormField
            label="Memo (optional)"
            placeholder="What's this payment for?"
            value={memo}
            onChangeText={setMemo}
            error={memoError}
          />
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Copy Address"
          onPress={handleCopyAddress}
          style={styles.actionButton}
        />
        <Button
          title="Share"
          variant="secondary"
          onPress={handleShare}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SIZES.xl,
      alignItems: "center",
    },
    qrContainer: {
      backgroundColor: colors.textPrimary,
      padding: SIZES.lg,
      borderRadius: RADIUS.lg,
      marginBottom: SIZES.md,
    },
    requestBadge: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: SIZES.md,
    },
    addressContainer: {
      width: "100%",
      marginBottom: SIZES.md,
    },
    addressLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: SIZES.xs,
    },
    addressBox: {
      backgroundColor: colors.surface,
      padding: SIZES.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressText: {
      color: colors.textPrimary,
      fontSize: 14,
      textAlign: "center",
    },
    toggle: {
      marginBottom: SIZES.md,
    },
    toggleText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    requestFields: {
      width: "100%",
      marginBottom: SIZES.md,
    },
    actions: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: SIZES.md,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: SIZES.xs,
    },
  });
