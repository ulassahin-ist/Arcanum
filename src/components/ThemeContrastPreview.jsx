import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Small, understated strip of the theme's key colors next to a sample
// "Aa" — enough to judge contrast at a glance without a huge box.
export default function ThemeContrastPreview({ colors, height = 84 }) {
  const swatches = [
    { key: 'bg', color: colors.bg },
    { key: 'card', color: colors.card },
    { key: 'primary', color: colors.primary },
    { key: 'secondary', color: colors.secondary },
    { key: 'success', color: colors.success },
    { key: 'danger', color: colors.danger },
  ];

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.bg, borderColor: colors.border, height },
      ]}
    >
      <Text style={[styles.sample, { color: colors.text }]}>Aa</Text>
      <View style={styles.dots}>
        {swatches.map(s => (
          <View
            key={s.key}
            style={[
              styles.dot,
              { backgroundColor: s.color, borderColor: colors.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sample: { fontSize: 26, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
});
