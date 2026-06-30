import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { SHADOW } from '../theme/shadows';

export default function BookCardList({ book, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
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
        <Text style={styles.title} numberOfLines={1}>
          {book.title}
        </Text>
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
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
    backgroundColor: C.bg,
    marginRight: SPACING.md,
  },
  coverImg: { width: '100%', height: '100%' },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.greenBg,
  },
  fallbackTxt: { fontSize: 14, fontWeight: '800', color: C.green },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: C.text },
  author: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  progressTrack: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: C.green, borderRadius: 2 },
  progressTxt: { fontSize: 10, color: C.textMuted, marginTop: 4 },
});
