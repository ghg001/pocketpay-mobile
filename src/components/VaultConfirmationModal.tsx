import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SIZES, RADIUS } from '../constants/theme';
import { Button } from './Button';

interface VaultConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  amount: string;
  description: string;
  confirmText?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const VaultConfirmationModal: React.FC<VaultConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  amount,
  description,
  confirmText = 'Confirm',
  isLoading = false,
  disabled = false,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={isLoading ? undefined : onClose}>
        <View style={styles.contentContainer} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{amount}</Text>
          </View>
          
          <Text style={styles.description}>{description}</Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="outline"
              disabled={isLoading || disabled}
              onPress={onClose}
              style={styles.button}
            />
            <Button
              title={confirmText}
              disabled={disabled}
              isLoading={isLoading}
              onPress={onConfirm}
              style={styles.button}
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.md,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  amountContainer: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: RADIUS.md,
    marginBottom: SIZES.md,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    marginHorizontal: SIZES.xs,
    height: 48,
  },
});
