import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS, SPACING } from '../theme/spacing';

export default function ToggleRow({ icon, title, subtitle, value, onChange }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          {icon}
          <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
      />
    </View>
  );
}

const getStyles = colors =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    textCol: { flex: 1, marginRight: SPACING.md },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 14, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  });
