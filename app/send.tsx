import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { AsyncActionButton } from "../src/components/AsyncActionButton";
import { FormField } from "../src/components/FormField";
import { QrScanner } from "../src/components/QrScanner";
import { ContactPicker } from "../src/components/ContactPicker";
import { ContactForm } from "../src/components/ContactForm";
import { SIZES, RADIUS, ThemeColors } from "../src/constants/theme";
import { useTheme } from "../src/hooks/useTheme";
import { sendXlmTransaction } from "../src/services/stellar";
import { useWalletStore } from "../src/store/walletStore";
import { useAppStore } from "../src/store/appStore";
import { useContactStore } from "../src/features/contacts/contactStore";
import {
  validateAddress,
  validateAmount,
  validateMemo,
} from "../src/utils/validation";
import { resolveAddressLabel } from "../src/utils/contacts";
import { formatAmount, getMaxSendableAmount } from "../src/utils/amount";
import { WALLET_SECRET_ACCESS_MESSAGE } from "../src/utils/walletStorageErrors";
import {
  Send as SendIcon,
  ScanLine,
  ChevronDown,
  User,
  Info,
} from "lucide-react-native";
import { ScreenHeader } from "@/components";
import { useNetworkState } from "../src/hooks/useNetworkState";
import { NetworkStatusBanner } from "../src/components/NetworkStatusBanner";

interface FieldErrors {
  destination?: string;
  amount?: string;
  memo?: string;
}

const getNetworkLabel = (): string => {
  const network = (process.env.EXPO_PUBLIC_STELLAR_NETWORK || "TESTNET").toUpperCase();
  if (network === "PUBLIC" || network === "MAINNET") return "Public Network";
  if (network === "TESTNET") return "Testnet";
  return network;
};
export default function SendScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { publicKey, getSecretKey, refreshWalletData, balance, fundingStatus, error } =
    useWalletStore();
  const contacts = useAppStore((state) => state.contacts);
  const { getContactByAddress, addRecentRecipient } = useContactStore();
  const { state: networkState, disableWriteActions, retry } = useNetworkState({ error });

  const isUnfunded = fundingStatus === 'unfunded';
  const sendDisabled = isUnfunded || !publicKey || disableWriteActions;

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [lastSendDestination, setLastSendDestination] = useState("");

  const destinationContact =
    destination.trim() && !errors.destination
      ? resolveAddressLabel(destination.trim(), contacts)
      : null;

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setErrors((prev) => ({
      ...prev,
      destination: value.trim()
        ? (validateAddress(value, publicKey) ?? undefined)
        : undefined,
    }));
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setErrors((prev) => ({
      ...prev,
      amount: value.trim()
        ? (validateAmount(value, balance) ?? undefined)
        : undefined,
    }));
  };

  const handleMemoChange = (value: string) => {
    setMemo(value);
    setErrors((prev) => ({
      ...prev,
      memo: validateMemo(value) ?? undefined,
    }));
  };

  const handleSelectContact = (contactPublicKey: string) => {
    setDestination(contactPublicKey);
    setErrors((prev) => ({
      ...prev,
      destination: validateAddress(contactPublicKey, publicKey) ?? undefined,
    }));
    setShowContactPicker(false);
  };

  const handleAddNewContact = () => {
    setShowContactPicker(false);
    setShowContactForm(true);
  };

  const handleSaveContact = (name: string, address: string) => {
    useContactStore.getState().addContact(name, address);
    setShowContactForm(false);
  };

  const handleScanSuccess = (address: string) => {
    setIsScanning(false);
    handleDestinationChange(address);
  };

  const handleScanError = (message: string) => {
    setIsScanning(false);
    Alert.alert("Invalid QR Code", message);
  };

  const handleScanClose = () => {
    setIsScanning(false);
  };

  const handleSetMaxAmount = () => {
    const maxAmount = getMaxSendableAmount(balance);
    setAmount(maxAmount);
    setErrors((prev) => ({
      ...prev,
      amount: validateAmount(maxAmount, balance) ?? undefined,
    }));
  };

  const handleSend = () => {
    const fieldErrors: FieldErrors = {
      destination: validateAddress(destination, publicKey) ?? undefined,
      amount: validateAmount(amount, balance) ?? undefined,
      memo: validateMemo(memo) ?? undefined,
    };
    setErrors(fieldErrors);
    if (fieldErrors.destination || fieldErrors.amount || fieldErrors.memo) {
      return;
    }

    // Navigate to the signing confirmation screen
    router.push({
      pathname: '/sign-confirmation',
      params: {
        source: publicKey || '',
        destination: destination.trim(),
        amount: amount.trim(),
        assetCode: 'XLM',
        memo: memo.trim(),
        fee: '100',
        network: getNetworkLabel(),
      },
    });
  };

  

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScreenHeader
          title="Send XLM"
          subtitle={`Available Balance: ${formatAmount(balance)} XLM`}
        />

        {/* Issue #330: Show unfunded account warning */}
        <NetworkStatusBanner
          state={networkState}
          onRetry={() => { refreshWalletData(); retry(); }}
        />

        {isUnfunded && (
          <View style={styles.unfundedWarning}>
            <Info color={colors.warning} size={18} style={{ marginRight: SIZES.sm }} />
            <Text style={styles.unfundedWarningText}>
              Your account has not been funded yet. Fund it with Friendbot on the home screen before sending.
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <FormField
            label="Destination Address (Public Key)"
            placeholder="G..."
            value={destination}
            onChangeText={handleDestinationChange}
            error={errors.destination}
            autoCapitalize="none"
            autoCorrect={false}
            helperText="Enter the recipient's Stellar public key (starts with 'G')"
            rightIcon={
              <TouchableOpacity
                onPress={() => setIsScanning(true)}
                accessibilityLabel="Scan QR code for recipient address"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ScanLine size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.contactPickerButton}
            onPress={() => setShowContactPicker(true)}
            accessibilityLabel="Choose from saved contacts"
            accessibilityRole="button"
          >
            <User size={18} color={colors.primary} />
            <Text style={styles.contactPickerText}>
              Choose from saved contacts
            </Text>
          </TouchableOpacity>

          {destinationContact?.isContact ? (
            <View style={styles.contactMatch}>
              <Text style={styles.contactMatchText}>
                Sending to saved contact: {destinationContact.label}
              </Text>
            </View>
          ) : null}

          <FormField
            label="Amount (XLM)"
            placeholder="0.00"
            value={amount}
            onChangeText={handleAmountChange}
            error={errors.amount}
            keyboardType="decimal-pad"
            helperText={`Available balance: ${formatAmount(balance)} XLM`}
            rightIcon={
              <TouchableOpacity
                onPress={handleSetMaxAmount}
                accessibilityLabel="Send maximum amount"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
                  Send Max
                </Text>
              </TouchableOpacity>
            }
          />

          <FormField
            label="Memo (Optional)"
            placeholder="Payment reference"
            value={memo}
            onChangeText={handleMemoChange}
            helperText="Add a note for the recipient"
          />
        </View>

        <View style={styles.warningContainer}>
          <Info size={16} color={colors.textSecondary} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            Please ensure the recipient address is correct. Blockchain payments cannot be reversed.
          </Text>
        </View>

        <AsyncActionButton
          title={
            networkState === 'wrong-network'
              ? 'Wrong Network'
              : disableWriteActions
              ? 'Network Unavailable'
              : isUnfunded
              ? 'Funding Required'
              : 'Send Payment'
          }
          onPress={handleSend}
          isLoading={isLoading}
          loadingText="Sending…"
          disabled={sendDisabled}
          style={styles.sendButton}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={isScanning}
        animationType="slide"
        onRequestClose={handleScanClose}
        accessibilityViewIsModal
      >
        <QrScanner
          onScan={handleScanSuccess}
          onError={handleScanError}
          onClose={handleScanClose}
        />
      </Modal>

      <ContactPicker
        visible={showContactPicker}
        onCancel={() => setShowContactPicker(false)}
        onSelect={handleSelectContact}
        onAddNew={handleAddNewContact}
      />

      <ContactForm
        visible={showContactForm}
        contact={lastSendDestination ? { id: '', name: '', address: lastSendDestination } : null}
        onCancel={() => {
          setShowContactForm(false);
          setLastSendDestination("");
        }}
        onSave={handleSaveContact}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SIZES.xl,
    },
    form: {
      flex: 1,
    },
    contactPickerContainer: {
      marginBottom: SIZES.md,
    },
    contactPickerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.md,
      gap: SIZES.sm,
    },
    contactPickerText: {
      flex: 1,
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    contactList: {
      marginTop: SIZES.xs,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SIZES.sm,
      maxHeight: 200,
    },
    contactItem: {
      paddingVertical: SIZES.sm,
      paddingHorizontal: SIZES.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    contactName: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 14,
      marginBottom: 2,
    },
    contactKey: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    contactMatch: {
      marginTop: -SIZES.sm,
      marginBottom: SIZES.md,
    },
    contactMatchText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "500",
    },
  unfundedWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.25)',
    marginBottom: SIZES.md,
  },
  unfundedWarningText: {
    flex: 1,
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  sendButton: {
    marginBottom: SIZES.xxl,
  },
  });
