import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SIZES } from '../constants/theme';
import { Lock, Info } from 'lucide-react-native';

export interface DurationOption {
  id: string;
  label: string;
  apy: string;
  months: number;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { id: '1m', label: '1 Month', apy: '4.0% APY', months: 1 },
  { id: '3m', label: '3 Months', apy: '4.5% APY', months: 3 },
  { id: '6m', label: '6 Months', apy: '5.0% APY', months: 6 },
  { id: '12m', label: '12 Months', apy: '6.0% APY', months: 12 },
];

interface LockDurationSelectorProps {
  selectedId: string | null;
  onSelect: (option: DurationOption) => void;
  error?: string;
}

export const LockDurationSelector: React.FC<LockDurationSelectorProps> = ({
  selectedId,
  onSelect,
  error,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Lock Duration</Text>
      
      <View style={styles.grid}>
        {DURATION_OPTIONS.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <TouchableOpacity
              key={option.id}
              testID={`duration-option-${option.id}`}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                error ? styles.optionCardError : null,
              ]}
              onPress={() => onSelect(option)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {isSelected && <Lock size={14} color={COLORS.primary} />}
              </View>
              <Text style={[styles.optionApy, isSelected && styles.optionApySelected]}>
                {option.apy}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.helperContainer}>
        <Info size={16} color={COLORS.textSecondary} style={styles.helperIcon} />
        <Text style={styles.helperText}>
          Locking funds means they cannot be withdrawn until the selected duration expires. A higher duration yields a better interest rate (APY).
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SIZES.sm,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -SIZES.xs,
  },
  optionCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    marginHorizontal: '1.5%',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  optionCardError: {
    borderColor: COLORS.error,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  optionLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionApy: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '500',
  },
  optionApySelected: {
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
  },
  helperContainer: {
    flexDirection: 'row',
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.xs,
    alignItems: 'flex-start',
  },
  helperIcon: {
    marginRight: SIZES.sm,
    marginTop: 2,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
