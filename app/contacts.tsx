/**
 * ContactsScreen
 *
 * Supports two ways to add a contact:
 *  1. Manual entry – type a name and a Stellar public key.
 *  2. Scan-to-add  – open the QR scanner, scan an address, then type a name.
 *
 * Duplicate detection: if the scanned or typed address already exists in the
 * contact list, the user is informed before they can save. An "update existing
 * entry" path is offered when a duplicate address is detected.
 *
 * Accessibility: interactive elements carry accessibilityLabel / accessibilityRole.
 */

import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Alert, Modal, TouchableOpacity } from "react-native";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { QrScanner } from "../src/components/QrScanner";
import { SIZES, RADIUS, ThemeColors } from "../src/constants/theme";
import { useTheme } from "../src/hooks/useTheme";
import { useAppStore, Contact } from "../src/store/appStore";
import { validateAddress } from "../src/utils/validation";
import { Trash2, User, AlertTriangle, Pencil } from "lucide-react-native";
import { EmptyState } from "../src/components/EmptyState";
import { useConfirm } from "../src/hooks/useConfirm";

// ── View modes ───────────────────────────────────────────────────────────────
type Mode =
    | "list" // Default: show contact list
    | "manual" // Manual add form (name + address)
    | "scanning" // Full-screen QR scanner
    | "confirm-scan"; // Post-scan form: address pre-filled, enter name

export default function ContactsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { contacts, addContactIfUnique, removeContact, updateContact, findDuplicateContact } =
    useAppStore();
  const { confirm, confirmationDialog } = useConfirm();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("list");
  const [name, setName] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [nameWarning, setNameWarning] = useState<string | undefined>();
  const [keyError, setKeyError] = useState<string | undefined>();
  const [foundDuplicate, setFoundDuplicate] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setName("");
    setPublicKey("");
    setNameError(undefined);
    setNameWarning(undefined);
    setKeyError(undefined);
    setFoundDuplicate(null);
    setIsSaving(false);
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError && value.trim()) setNameError(undefined);
    // Check for duplicate name (case-insensitive) — warn but don't block
    if (value.trim()) {
      const result = findDuplicateContact(value, publicKey || "G");
      if (result.type === "name") {
        setNameWarning(result.message);
      } else {
        setNameWarning(undefined);
      }
    } else {
      setNameWarning(undefined);
    }
  };

  const handleKeyChange = (value: string) => {
    setPublicKey(value);
    if (foundDuplicate) setFoundDuplicate(null);
    if (!value.trim()) {
      setKeyError(undefined);
      return;
    }
    const addrError = validateAddress(value);
    if (addrError) {
      setKeyError(addrError);
      return;
    }
    // Check for duplicate address using the store's centralized logic
    const result = findDuplicateContact(name || "temp", value);
    if (result.type === "address") {
      setKeyError(result.message);
      return;
    }
    setKeyError(undefined);
  };

  // ── Save handler (used by both manual and scan-confirm forms) ───────────────

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedKey = publicKey.trim();

    const currentNameError = trimmedName ? undefined : "Please enter a name.";
    const addrValidationError = validateAddress(trimmedKey) ?? undefined;
    const currentKeyError = addrValidationError;

    setNameError(currentNameError);
    setKeyError(currentKeyError);

    if (currentNameError || currentKeyError) return;

    const newContact: Contact = {
      id: Date.now().toString(),
      name: trimmedName,
      publicKey: trimmedKey,
    };

    try {
      setIsSaving(true);
      const result = await addContactIfUnique(newContact);

      if (result.type === "address") {
        // Show the update-existing banner instead of just an error
        const existing = contacts.find((c) => c.publicKey === trimmedKey);
        if (existing) {
          setFoundDuplicate(existing);
        }
        setKeyError(result.message);
        return;
      }

      resetForm();
      setMode("list");
    } catch {
      Alert.alert("Error", "Failed to save contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExisting = async () => {
    if (!foundDuplicate) return;
    const newName = name.trim() || foundDuplicate.name;
    try {
      await updateContact(foundDuplicate.id, newName);
      Alert.alert(
        "Updated",
        `Contact "${foundDuplicate.name}" has been updated to "${newName}".`,
      );
      resetForm();
      setMode("list");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update contact.");
    }
  };

  // ── QR scanner callbacks ────────────────────────────────────────────────────

  const handleScanSuccess = useCallback(
      (address: string) => {
        // Check for duplicates using the store's centralized logic.
        const result = findDuplicateContact("", address);
        if (result.type === "address") {
          Alert.alert("Already saved", result.message);
          setMode("list");
          return;
        }
        // Pre-fill the address and switch to the confirm form.
        setPublicKey(address);
        setMode("confirm-scan");
      },
      [findDuplicateContact],
  );

  const handleScanError = useCallback((message: string) => {
    Alert.alert("Invalid QR Code", message);
    setMode("list");
  }, []);

  const handleScanClose = useCallback(() => {
    setMode("list");
    resetForm();
  }, [resetForm]);

  // ── Remove handler with confirmation ──────────────────────────────────────────

  const handleRemove = (contact: Contact) => {
    // Safely identify the contact with name or truncated address
    const displayName = contact.name ||
        (contact.publicKey ? `${contact.publicKey.slice(0, 8)}...${contact.publicKey.slice(-6)}` : 'this contact');

    void confirm({
      title: "Delete Contact",
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
      onConfirm: () => removeContact(contact.id),
    });
  };

  // ── Render: full-screen QR scanner ─────────────────────────────────────────
  if (mode === "scanning") {
    return (
        <Modal
            visible
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
    );
  }

  // ── Render: add form (manual or post-scan confirm) ──────────────────────────
  const isFormMode = mode === "manual" || mode === "confirm-scan";

  return (
    <View style={styles.container}>
      {isFormMode ? (
        <View style={styles.addForm}>
          <Text style={styles.title}>
            {mode === "confirm-scan"
              ? "Save Scanned Contact"
              : "Add New Contact"}
          </Text>

          {/* Name field */}
          <Input
            label="Name"
            placeholder="Alice"
            value={name}
            onChangeText={handleNameChange}
            error={nameError}
            autoFocus
            accessibilityLabel="Contact name"
          />
          {nameWarning && !nameError && (
            <Text style={styles.warningText}>{nameWarning}</Text>
          )}

          {/* Address field – read-only when pre-filled from scan */}
          <Input
            label="Stellar Address"
            placeholder="G..."
            value={publicKey}
            onChangeText={handleKeyChange}
            error={keyError}
            autoCapitalize="none"
            autoCorrect={false}
            editable={mode !== "confirm-scan"}
            accessibilityLabel="Stellar public key address"
          />
          {/* Duplicate address update banner */}
          {foundDuplicate && (
            <View style={styles.duplicateBanner}>
              <View style={styles.duplicateBannerHeader}>
                <AlertTriangle color={colors.warning} size={18} />
                <Text style={styles.duplicateBannerTitle}>Duplicate Address</Text>
              </View>
              <Text style={styles.duplicateBannerText}>
                This address is already saved as "{foundDuplicate.name}".
              </Text>
              <Text style={styles.duplicateBannerHint}>
                You can update the existing entry's name below, or cancel to keep it unchanged.
              </Text>
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdateExisting}>
                <Pencil color={colors.primary} size={16} />
                <Text style={styles.updateButtonText}>
                  Update "{foundDuplicate.name}" to "{name.trim() || foundDuplicate.name}"
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scan button (only in manual mode – lets the user switch to scanner) */}
          {mode === "manual" && (
            <Button
              title="Scan QR Instead"
              variant="outline"
              onPress={() => {
                resetForm();
                setMode("scanning");
              }}
              style={styles.scanInsteadBtn}
              accessibilityLabel="Open QR scanner"
            />
          )}

          <View style={styles.actions}>
            <Button
              title="Save Contact"
              onPress={handleSave}
              isLoading={isSaving}
              style={styles.actionBtn}
              accessibilityLabel="Save contact"
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                resetForm();
                setMode("list");
              }}
              style={styles.actionBtn}
              accessibilityLabel="Cancel"
            />
          </View>
        </View>
        ) : (
            <>
              {/* ── List header: two action buttons ────────────────────────────── */}
              <View style={styles.headerActions}>
                <Button
                    title="+ Add Manually"
                    onPress={() => {
                      resetForm();
                      setMode("manual");
                    }}
                    style={styles.headerBtn}
                    accessibilityLabel="Add contact manually"
                />
                <Button
                    title="Scan QR"
                    variant="secondary"
                    onPress={() => {
                      resetForm();
                      setMode("scanning");
                    }}
                    style={styles.headerBtn}
                    accessibilityLabel="Scan QR code to add contact"
                />
              </View>

              {/* ── Contact list ─────────────────────────────────────────────────── */}
              <FlatList
                  data={contacts}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <EmptyState
                        icon={<User color={colors.textMuted} size={48} />}
                        title="No contacts yet"
                        message="Add a contact manually or scan a QR code."
                    />
                  }
                  renderItem={({ item }) => (
                      <View style={styles.contactItem}>
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>{item.name}</Text>
                          <Text
                              style={styles.contactKey}
                              numberOfLines={1}
                              ellipsizeMode="middle"
                          >
                            {item.publicKey}
                          </Text>
                        </View>
                        <Trash2
                            color={colors.error}
                            size={20}
                            onPress={() => handleRemove(item)}
                            accessibilityLabel={`Remove ${item.name}`}
                            accessibilityRole="button"
                        />
                      </View>
                  )}
              />
            </>
        )}

        {confirmationDialog}
      </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SIZES.lg,
    },
    // ── Header ──────────────────────────────────────────────────────────────────
    headerActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: SIZES.lg,
      gap: SIZES.sm,
    },
    headerBtn: {
      flex: 1,
    },
    // ── Add / confirm form ───────────────────────────────────────────────────────
    addForm: {
      backgroundColor: colors.surface,
      padding: SIZES.xl,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: SIZES.lg,
    },
    warningText: {
      color: colors.warning,
      fontSize: 12,
      marginTop: -SIZES.xs,
      marginBottom: SIZES.md,
      marginLeft: SIZES.xs,
    },
    scanInsteadBtn: {
      marginBottom: SIZES.md,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: SIZES.md,
      gap: SIZES.sm,
    },
    actionBtn: {
      flex: 1,
    },
    // ── Duplicate address banner ────────────────────────────────────────────────
    duplicateBanner: {
      backgroundColor: "rgba(255, 196, 0, 0.08)",
      borderRadius: RADIUS.md,
      padding: SIZES.md,
      marginTop: SIZES.sm,
      marginBottom: SIZES.sm,
      borderWidth: 1,
      borderColor: "rgba(255, 196, 0, 0.25)",
    },
    duplicateBannerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SIZES.sm,
      marginBottom: SIZES.xs,
    },
    duplicateBannerTitle: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: "700",
    },
    duplicateBannerText: {
      color: colors.warning,
      fontSize: 13,
      marginBottom: SIZES.xs,
      lineHeight: 18,
    },
    duplicateBannerHint: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: SIZES.md,
      lineHeight: 17,
    },
    updateButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 229, 255, 0.1)",
      borderRadius: RADIUS.sm,
      padding: SIZES.sm + 2,
      gap: SIZES.sm,
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.2)",
    },
    updateButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
      flex: 1,
    },
    // ── Contact list ─────────────────────────────────────────────────────────────
    listContent: {
      paddingBottom: SIZES.xxl,
    },
    contactItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: SIZES.lg,
      borderRadius: RADIUS.md,
      marginBottom: SIZES.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactInfo: {
      flex: 1,
      marginRight: SIZES.md,
    },
    contactName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    contactKey: {
      color: colors.textSecondary,
      fontSize: 12,
    },
  });
