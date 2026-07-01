import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS } from '../theme/spacing';

// Compact, wrapping row of small pills — used anywhere we used to need a
// grid of big boxes (theme swatches, font choices, sort order, etc).
// `options`: [{ key, label, dot?, fontFamily? }]
export default function PillSelector({ options, value, onChange }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.row}>
      {options.map(opt => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            {opt.dot ? (
              <View style={[styles.dot, { backgroundColor: opt.dot }]} />
            ) : null}
            <Text
              style={[
                styles.label,
                opt.fontFamily ? { fontFamily: opt.fontFamily } : null,
                selected && styles.labelSelected,
              ]}
            >
              {opt.label}
            </Text>
            {selected && (
              <Check size={13} color={colors.primary} style={styles.check} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = colors =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: RADIUS.sm + 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 6,
    },
    pillSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.bg,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSub },
    labelSelected: { color: colors.text },
    check: { marginLeft: 2 },
  });
