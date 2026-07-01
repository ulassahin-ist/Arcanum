import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS, SPACING } from '../theme/spacing';
import { SHADOW_SM } from '../theme/shadows';
import { Star } from 'lucide-react-native';

export default function BookCardGrid({ book, onPress, onLongPress, width }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[styles.wrap, { width }]}
    >
      <View style={[styles.cover, { height: width * 1.5 }]}>
        {book.coverUri ? (
          <Image source={{ uri: book.coverUri }} style={styles.coverImg} />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackTxt} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}
        {book.favorite && (
          <View style={styles.favoriteBadge}>
            <Star size={12} color={colors.onAccent} fill={colors.onAccent} />
          </View>
        )}
        {book.progress > 0 && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${book.progress * 100}%` },
              ]}
            />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {book.title}
      </Text>
    </Pressable>
  );
}

const getStyles = colors => StyleSheet.create({
  wrap: { marginBottom: SPACING.lg },
  cover: {
    width: '100%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: colors.card,
    ...SHADOW_SM,
  },
  coverImg: { width: '100%', height: '100%' },
  fallback: {
    flex: 1,
    backgroundColor: colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  fallbackTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  progressFill: { height: 3, backgroundColor: colors.success },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 6,
  },
});
