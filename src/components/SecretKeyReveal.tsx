import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, Copy } from 'lucide-react-native';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useConfirm } from '../hooks/useConfirm';
import { Button } from './Button';
import { copyToClipboard } from '../utils/clipboard';

interface SecretKeyRevealProps {
  secretKey: string;
  warningTitle?: string;
  warningMessage?: string;
  autoHideMs?: number;
}

export const SecretKeyReveal: React.FC<SecretKeyRevealProps> = ({
  secretKey,
  warningTitle = 'Security Warning',
  warningMessage = 'Anyone with this key can steal your funds. Are you sure you want to reveal it?',
  autoHideMs = 30000,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { confirm, confirmationDialog } = useConfirm();
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isRevealed) {
      timeoutId = setTimeout(() => {
        setIsRevealed(false);
      }, autoHideMs);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRevealed, autoHideMs]);

  const handleReveal = () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    void confirm({
      title: warningTitle,
      message: warningMessage,
      confirmLabel: 'Reveal',
      destructive: true,
      onConfirm: () => setIsRevealed(true),
    });
  };

  const handleCopy = async () => {
    const result = await copyToClipboard(secretKey);
    if (result.ok) {
      Alert.alert('Copied', 'Secret key copied to clipboard. Keep it safe!');
    } else {
      Alert.alert(
        'Copy Failed',
        'Could not copy to clipboard. You can select and copy the revealed key manually instead.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <View style={styles.keyWrapper}>
          {isRevealed ? (
            <Text style={styles.secretValue} selectable accessible={true} accessibilityLabel="Revealed secret key">
              {secretKey}
            </Text>
          ) : (
            <Text style={styles.maskedValue} accessible={true} accessibilityLabel="Masked secret key">
              ********************************************************
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReveal}
            accessible={true}
            accessibilityLabel={isRevealed ? "Hide secret key" : "Reveal secret key"}
          >
            {isRevealed ? <EyeOff color={colors.textPrimary} size={20} /> : <Eye color={colors.textPrimary} size={20} />}
            <Text style={styles.actionText}>{isRevealed ? 'Hide' : 'Reveal'}</Text>
          </TouchableOpacity>

          {isRevealed && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopy}
              accessible={true}
              accessibilityLabel="Copy secret key"
            >
              <Copy color={colors.textPrimary} size={20} />
              <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {confirmationDialog}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginVertical: SIZES.sm,
  },
  box: {
    backgroundColor: 'rgba(255, 61, 0, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
    overflow: 'hidden',
  },
  keyWrapper: {
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 61, 0, 0.1)',
  },
  secretValue: {
    color: colors.error,
    fontSize: 14,
    fontWeight: 'bold',
  },
  maskedValue: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 61, 0, 0.02)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
    height: 44, // Minimum touch target
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SIZES.xs,
  },
});
