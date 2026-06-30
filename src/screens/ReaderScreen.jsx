import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, PanResponder } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { updateProgress, addBookmark, removeBookmark } from '../storage/library';
import PdfReader from '../components/PdfReader';
import EpubReader from '../components/EpubReader';
import ContextMenu from '../components/ContextMenu';
import { ChevronLeft, Star } from 'lucide-react-native';

export default function ReaderScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { book } = route.params;
  const [chrome, setChrome] = useState(true);
  const [progress, setProgress] = useState(book.progress || 0);
  const [bookmarks, setBookmarks] = useState(book.bookmarks || []);
  const [bookmarkMenu, setBookmarkMenu] = useState({
    visible: false,
    anchor: null,
    bookmark: null,
  });
  const [scrubPercent, setScrubPercent] = useState(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const readerRef = useRef(null);
  // Latest precise location: epub CFI or pdf page number, used when bookmarking.
  const locationRef = useRef(
    book.fileType === 'pdf' ? book.page : book.progressCfi,
  );

  const handleProgress = useCallback(
    (p, extra) => {
      setProgress(p);
      locationRef.current = extra;
      if (book.fileType === 'pdf') {
        updateProgress(book.id, p, { page: extra });
      } else {
        updateProgress(book.id, p, { progressCfi: extra });
      }
    },
    [book.id, book.fileType],
  );

  function seekToPercent(percent) {
    readerRef.current?.seekTo({ percent: Math.min(Math.max(percent, 0), 1) });
  }

  function seekToBookmark(bookmark) {
    readerRef.current?.seekTo({
      percent: bookmark.percent,
      cfi: bookmark.cfi,
      page: bookmark.page,
    });
  }

  async function handleAddBookmark() {
    const current = locationRef.current;
    const alreadyBookmarked = bookmarks.some(bm =>
      book.fileType === 'pdf' ? bm.page === current : bm.cfi === current,
    );
    if (alreadyBookmarked || current == null) return;

    const bookmark = {
      id: `${Date.now()}`,
      percent: progress,
      createdAt: Date.now(),
      ...(book.fileType === 'pdf' ? { page: current } : { cfi: current }),
    };
    setBookmarks(prev => [...prev, bookmark]);
    await addBookmark(book.id, bookmark);
  }

  function openBookmarkMenu(bookmark, event) {
    const { pageX, pageY } = event.nativeEvent;
    setBookmarkMenu({
      visible: true,
      anchor: { x: pageX, y: pageY },
      bookmark,
    });
  }

  function closeBookmarkMenu() {
    setBookmarkMenu(prev => ({ ...prev, visible: false }));
  }

  async function handleRemoveBookmark(bookmark) {
    setBookmarks(prev => prev.filter(bm => bm.id !== bookmark.id));
    await removeBookmark(book.id, bookmark.id);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        if (!trackWidth) return;
        setScrubPercent(
          Math.min(Math.max(e.nativeEvent.locationX / trackWidth, 0), 1),
        );
      },
      onPanResponderMove: e => {
        if (!trackWidth) return;
        setScrubPercent(
          Math.min(Math.max(e.nativeEvent.locationX / trackWidth, 0), 1),
        );
      },
      onPanResponderRelease: () => {
        setScrubPercent(current => {
          if (current != null) seekToPercent(current);
          return null;
        });
      },
      onPanResponderTerminate: () => setScrubPercent(null),
    }),
  ).current;

  const displayPercent = scrubPercent ?? progress;
  return (
    <View style={styles.root}>
      {book.fileType === 'pdf' ? (
        <PdfReader
          ref={readerRef}
          uri={book.fileUri}
          initialPage={book.page}
          onProgress={handleProgress}
          onToggleChrome={() => setChrome(v => !v)}
        />
      ) : (
        <EpubReader
          ref={readerRef}
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
          style={[styles.topBar, { paddingTop: insets.top + 10 }]}
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

      {chrome && (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOutDown.duration(180)}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}
        >
          <View style={styles.bottomLabelRow}>
            <Text style={styles.bottomLabel} numberOfLines={1}>
              {book.title} · {Math.round(displayPercent * 100)}%
            </Text>
            <Pressable
              onPress={handleAddBookmark}
              hitSlop={10}
              style={styles.bookmarkBtn}
            >
              <Star size={15} color={colors.amber} />
            </Pressable>
          </View>
          <View
            style={styles.trackTouchArea}
            onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
          >
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  { width: `${Math.min(Math.max(displayPercent * 100, 0), 100)}%` },
                ]}
              />
            </View>
            {bookmarks.map(bm => (
              <Pressable
                key={bm.id}
                onPress={() => seekToBookmark(bm)}
                onLongPress={e => openBookmarkMenu(bm, e)}
                hitSlop={8}
                style={[styles.marker, { left: `${bm.percent * 100}%` }]}
              />
            ))}
          </View>
        </Animated.View>
      )}

      <ContextMenu
        visible={bookmarkMenu.visible}
        anchor={bookmarkMenu.anchor}
        onClose={closeBookmarkMenu}
        items={
          bookmarkMenu.bookmark
            ? [
                {
                  label: 'Go to bookmark',
                  onPress: () => seekToBookmark(bookmarkMenu.bookmark),
                },
                {
                  label: 'Remove bookmark',
                  destructive: true,
                  onPress: () => handleRemoveBookmark(bookmarkMenu.bookmark),
                },
              ]
            : []
        }
      />
    </View>
  );
}

const getStyles = colors => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.card,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  bookmarkBtn: {
    marginLeft: 10,
    padding: 2,
  },
  trackTouchArea: {
    height: 24,
    justifyContent: 'center',
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackFill: {
    height: 3,
    backgroundColor: colors.blue,
  },
  marker: {
    position: 'absolute',
    top: '50%',
    marginTop: -5,
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amber,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
});
