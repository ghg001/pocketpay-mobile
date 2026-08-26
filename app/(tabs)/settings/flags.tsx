import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { SIZES, RADIUS, ThemeColors } from '../../src/constants/theme';
import { FEATURE_FLAGS, isFeatureEnabled } from '../../src/config/featureFlags';
import { KeyRound, AlertTriangle, CheckCircle } from 'lucide-react-native';

export default function FeatureFlagsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const renderFlag = (key: keyof typeof FEATURE_FLAGS) => {
    const flag = FEATURE_FLAGS[key];
    const enabled = isFeatureEnabled(key);
    const Icon = flag.experimental ? AlertTriangle : CheckCircle;
    return (
      <View key={key} style={styles.row}>
        <View style={styles.rowLeft}>
          <Icon color={colors.primary} size={20} />
          <View style={styles.rowTextGroup}>
            <Text style={styles.rowText}>{key}</Text>
            <Text style={styles.rowHelper}>{flag.description}</Text>
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={() => {
            // In a real dev environment you might persist this to AsyncStorage.
            // Here we simply alert the developer.
            console.log(`Toggle ${key}`);
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={enabled ? colors.primary : colors.textMuted}
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Feature Flags (Development Only)</Text>
      {Object.keys(FEATURE_FLAGS).map((k) => renderFlag(k as keyof typeof FEATURE_FLAGS))}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: SIZES.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: SIZES.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SIZES.sm,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowTextGroup: {
      marginLeft: SIZES.md,
    },
    rowText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
    },
    rowHelper: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });
