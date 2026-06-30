import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { C } from '../theme/colors';
import { updateProgress } from '../storage/library';
import PdfReader from '../components/PdfReader';
import EpubReader from '../components/EpubReader';
import { ChevronLeft } from 'lucide-react-native';

export default function ReaderScreen({ route, navigation }) {
  const { book } = route.params;
  const insets = useSafeAreaInsets();
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
          style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={26} color={C.text} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(244,245,247,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backTxt: { fontSize: 28, color: C.text, marginTop: -3 },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginHorizontal: 8,
  },
  pct: { fontSize: 12, fontWeight: '600', color: C.textMuted },
});
