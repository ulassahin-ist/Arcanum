import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { C } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

const WRAP_WIDTH = 140;
const WRAP_PADDING = 2;
const INDICATOR_WIDTH = (WRAP_WIDTH - WRAP_PADDING * 2) / 2;

export default function ViewToggle({ value, onChange }) {
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

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: C.border,
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
    backgroundColor: C.bg,
    borderRadius: RADIUS.sm - 2,
  },
  label: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  labelActive: { color: C.text },
});
