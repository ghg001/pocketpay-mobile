import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SIZES, ThemeColors } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

interface ScreenHeaderProps {
  /** Main heading text for the screen. */
  title: string;
  /** Optional supporting text rendered below the title. */
  subtitle?: string;
  /**
   * Optional action(s) rendered to the right of the title/subtitle block,
   * e.g. a Button or an icon touchable. Accepts any React node so callers
   * can compose their own controls without ScreenHeader needing to know
   * about their internals.
   */
  actions?: React.ReactNode;
  testID?: string;
}

/**
 * Reusable title/subtitle header block used at the top of a screen's
 * scrollable/body content.
 *
 * This is a plain in-content component, not a native navigation header —
 * it does not read or affect `expo-router` navigation options, so dropping
 * it into a screen has no effect on that screen's navigation behaviour
 * (back button, header title bar, etc. on screens that use one).
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  actions,
  testID = "screen-header",
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.textBlock}>
        <Text style={styles.title} testID={`${testID}-title`}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actions ? (
        <View style={styles.actions} testID={`${testID}-actions`}>
          {actions}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginTop: SIZES.md,
      marginBottom: SIZES.xl,
    },
    textBlock: {
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: SIZES.xs,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    actions: {
      marginLeft: SIZES.md,
      flexDirection: "row",
      alignItems: "center",
      gap: SIZES.sm,
    },
  });
