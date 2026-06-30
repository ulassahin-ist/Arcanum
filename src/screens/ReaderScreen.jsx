import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { updateProgress } from '../storage/library';
import PdfReader from '../components/PdfReader';
import EpubReader from '../components/EpubReader';
import { ChevronLeft } from 'lucide-react-native';

export default function ReaderScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { book } = route.params;
  const [chrome, setChrome] = useState(true);
  const [progress, setProgress] = useState(book.progress || 0);

  const handleProgress = useCallback(
    (p, extra) => {
      setProgress(p);
      if (book.fileType === 'pdf') {
        updateProgress(book.id, p, { page: extra });
      } else {
        updateProgress(book.id, p, { progressCfi: extra });
      }
    },
    [book.id, book.fileType],
  );
  return (
    <View style={styles.root}>
      {book.fileType === 'pdf' ? (
        <PdfReader
          uri={book.fileUri}
          initialPage={book.page}
          onProgress={handleProgress}
          onToggleChrome={() => setChrome(v => !v)}
        />
      ) : (
        <EpubReader
          uri={book.fileUri}
          startCfi={book.progressCfi}
          onProgress={handleProgress}
          onToggleChrome={() => setChrome(v => !v)}
        />
      )}

      {chrome && (
        <Animated.View
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(180)}
          style={[styles.topBar]}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
        </Animated.View>
      )}
    </View>
  );
}

const getStyles = colors => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(244,245,247,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backTxt: { fontSize: 28, color: colors.text, marginTop: -3 },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 8,
  },
  pct: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
});
