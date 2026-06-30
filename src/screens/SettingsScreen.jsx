import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { THEMES, THEME_NAMES } from '../theme/colors';

const LABELS = {
  light: 'Light',
  dark: 'Dark',
  vignette: 'Vignette',
  candy: 'Candy',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { themeName, colors, setThemeName } = useTheme();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.bg, paddingTop: insets.top },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        Theme
      </Text>
      <View style={styles.swatchRow}>
        {THEME_NAMES.map(name => {
          const t = THEMES[name];
          const selected = name === themeName;
          return (
            <Pressable
              key={name}
              onPress={() => setThemeName(name)}
              style={[
                styles.swatch,
                {
                  backgroundColor: t.bg,
                  borderColor: selected ? t.blue : t.border,
                },
                selected && styles.swatchSelected,
              ]}
            >
              <View style={[styles.swatchDot, { backgroundColor: t.blue }]} />
              <Text style={[styles.swatchLabel, { color: t.text }]}>
                {LABELS[name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', marginTop: 12, marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: {
    width: 92,
    height: 92,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  swatchSelected: { borderWidth: 3 },
  swatchDot: { width: 24, height: 24, borderRadius: 12 },
  swatchLabel: { fontSize: 12, fontWeight: '700' },
});
