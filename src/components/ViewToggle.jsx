import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { C } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

export default function ViewToggle({ value, onChange }) {
  const isGrid = value === 'grid';

  const indicatorStyle = useAnimatedStyle(() => ({
    left: withTiming(isGrid ? 2 : '50%', { duration: 220 }),
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
    padding: 2,
    width: 140,
    height: 36,
  },
  half: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  indicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: '48%',
    backgroundColor: C.bg,
    borderRadius: RADIUS.sm - 2,
  },
  label: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  labelActive: { color: C.text },
});
