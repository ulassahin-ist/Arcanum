import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS, SPACING } from '../theme/spacing';
import { SHADOW } from '../theme/shadows';
import { Star } from 'lucide-react-native';

export default function BookCardList({ book, onPress, onLongPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={styles.card}
    >
      <View style={styles.cover}>
        {book.coverUri ? (
          <Image source={{ uri: book.coverUri }} style={styles.coverImg} />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackTxt} numberOfLines={2}>
              {book.title.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {book.title}
          </Text>
          {book.favorite && (
            <Star size={13} color={colors.secondary} fill={colors.secondary} style={styles.titleStar} />
          )}
        </View>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${book.progress * 100}%` }]}
          />
        </View>
        <Text style={styles.progressTxt}>
          {Math.round(book.progress * 100)}% complete
        </Text>
      </View>
    </Pressable>
  );
}

const getStyles = colors => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW,
  },
  cover: {
    width: 56,
    height: 80,
    borderRadius: RADIUS.sm - 4,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    marginRight: SPACING.md,
  },
  coverImg: { width: '100%', height: '100%' },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.successBg,
  },
  fallbackTxt: { fontSize: 14, fontWeight: '800', color: colors.success },
  info: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  titleStar: { marginLeft: 6 },
  author: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.success, borderRadius: 2 },
  progressTxt: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
});
