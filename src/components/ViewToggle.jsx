import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS } from '../theme/spacing';

const WRAP_WIDTH = 140;
const WRAP_PADDING = 2;
const INDICATOR_WIDTH = (WRAP_WIDTH - WRAP_PADDING * 2) / 2;

export default function ViewToggle({ value, onChange }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isGrid = value === 'grid';

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(isGrid ? 0 : INDICATOR_WIDTH, { duration: 220 }),
      },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <Pressable style={styles.half} onPress={() => onChange('grid')}>
        <Text style={[styles.label, isGrid && styles.labelActive]}>Grid</Text>
      </Pressable>
      <Pressable style={styles.half} onPress={() => onChange('list')}>
        <Text style={[styles.label, !isGrid && styles.labelActive]}>List</Text>
      </Pressable>
    </View>
  );
}

const getStyles = colors => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: WRAP_PADDING,
    width: WRAP_WIDTH,
    height: 36,
  },
  half: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  indicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: WRAP_PADDING,
    width: INDICATOR_WIDTH,
    backgroundColor: colors.bg,
    borderRadius: RADIUS.sm - 2,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.text },
});
