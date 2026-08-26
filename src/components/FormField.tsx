import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { RADIUS, SIZES, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface FormFieldProps extends TextInputProps {
  /** Label displayed above the input */
  label: string;
  /** Error message displayed below the input (takes precedence over helperText) */
  error?: string;
  /** Helper/instructional text displayed below the input when no error */
  helperText?: string;
  /** Left icon slot */
  leftIcon?: React.ReactNode;
  /** Right icon slot (hidden when secureTextEntry toggle is active) */
  rightIcon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry: initialSecure,
  editable = true,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const isSecureField = initialSecure;

  const isDisabled = !editable;

  const resolvedSecureTextEntry =
    isSecureField && !isSecureVisible ? true : false;

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
        {label}
      </Text>

      {/* Input Row */}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          isDisabled ? styles.inputDisabled : null,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            isDisabled && styles.inputTextDisabled,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          editable={!isDisabled}
          secureTextEntry={resolvedSecureTextEntry}
          {...props}
        />

        {/* Secure text toggle */}
        {isSecureField && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsSecureVisible((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isSecureVisible ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}

        {/* Custom right icon (only when not a secure field) */}
        {!isSecureField && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {/* Error or Helper Text */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: SIZES.sm,
    fontWeight: '500',
  },
  labelDisabled: {
    color: colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: SIZES.md,
    height: '100%',
  },
  inputTextDisabled: {
    color: colors.textMuted,
  },
  leftIcon: {
    paddingLeft: SIZES.md,
  },
  rightIcon: {
    paddingRight: SIZES.md,
  },
  iconButton: {
    paddingRight: SIZES.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
  },
});
