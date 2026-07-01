import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from '../components/AppText';
import Animated, {
  FadeInUp,
  FadeOutUp,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeepAwake from '@sayem314/react-native-keep-awake';
import { useTheme } from '../theme/ThemeContext';
import { getReaderFontFamily, getReaderFontSizeValue } from '../theme/fonts';
import {
  updateProgress,
  addBookmark,
  removeBookmark,
} from '../storage/library';
import PdfReader from '../components/PdfReader';
import EpubReader from '../components/EpubReader';
import CbzReader from '../components/CbzReader';
import TxtReader from '../components/TxtReader';
import ContextMenu from '../components/ContextMenu';
import { ChevronLeft, Star } from 'lucide-react-native';

export default function ReaderScreen({ route, navigation }) {
  const {
    colors,
    readerFont,
    readerFontSize,
    readingFlow,
    readingDirection,
    keepAwake,
    warmLight,
  } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { book } = route.params;
  const [chrome, setChrome] = useState(true);
  const [progress, setProgress] = useState(book.progress || 0);
  const [bookmarks, setBookmarks] = useState(book.bookmarks || []);
  const [isCurrentBookmarked, setIsCurrentBookmarked] = useState(false);
  const [bookmarkMenu, setBookmarkMenu] = useState({
    visible: false,
    anchor: null,
    bookmark: null,
  });
  // Ref, not state: read fresh on every tap via onLayout, no closure
  // staleness concerns since there's no memoized PanResponder involved.
  const trackWidthRef = useRef(0);

  const readerRef = useRef(null);
  // Latest precise location, used when bookmarking: epub CFI, pdf/cbz page
  // number, or null for txt (which only has a scroll percent — see below).
  const locationRef = useRef(
    book.fileType === 'pdf' || book.fileType === 'cbz'
      ? book.page
      : book.fileType === 'epub'
      ? book.progressCfi
      : null,
  );
  const handleProgress = useCallback(
    (p, extra) => {
      setProgress(p);
      locationRef.current = extra;
      setIsCurrentBookmarked(!!findBookmarkAt(extra, p));
      if (book.fileType === 'pdf' || book.fileType === 'cbz') {
        updateProgress(book.id, p, { page: extra });
      } else if (book.fileType === 'epub') {
        updateProgress(book.id, p, { progressCfi: extra });
      } else {
        // txt: percent is the only meaningful location, already saved as `p`
        updateProgress(book.id, p, {});
      }
    },
    [book.id, book.fileType, bookmarks],
  );
  function seekToPercent(percent) {
    const clamped = Math.min(Math.max(percent, 0), 1);
    readerRef.current?.seekTo({ percent: clamped });
    // Optimistically reflect the tap immediately so the fill doesn't wait
    // on the reader to confirm via its own 'progress' callback (which can
    // lag, especially for PDFs).
    setProgress(clamped);
  }

  function handleTrackPress(e) {
    const width = trackWidthRef.current;
    if (!width) return;
    seekToPercent(e.nativeEvent.locationX / width);
  }

  function seekToBookmark(bookmark) {
    readerRef.current?.seekTo({
      percent: bookmark.percent,
      cfi: bookmark.cfi,
      page: bookmark.page,
    });
    setProgress(bookmark.percent);
    setIsCurrentBookmarked(true);
  }

  const SAME_LOCATION_EPSILON = 0.0015;

  function findBookmarkAt(location, percent) {
    if (book.fileType === 'pdf' || book.fileType === 'cbz') {
      if (location == null) return null;
      return bookmarks.find(bm => bm.page === location);
    }
    if (book.fileType === 'epub') {
      if (location == null) return null;
      return bookmarks.find(
        bm =>
          bm.cfi === location ||
          Math.abs(bm.percent - percent) < SAME_LOCATION_EPSILON,
      );
    }
    // txt: no stable location id (font size changes reflow the scroll
    // range anyway), so proximity-by-percent is the best we can do.
    return bookmarks.find(
      bm => Math.abs(bm.percent - percent) < SAME_LOCATION_EPSILON,
    );
  }
  async function handleToggleBookmark() {
    const current = locationRef.current;
    if (current == null) return;

    const existing = findBookmarkAt(current, progress);
    if (existing) {
      await handleRemoveBookmark(existing);
      return;
    }

    const bookmark = {
      id: `${Date.now()}`,
      percent: progress,
      createdAt: Date.now(),
      ...(book.fileType === 'pdf' || book.fileType === 'cbz'
        ? { page: current }
        : book.fileType === 'epub'
        ? { cfi: current }
        : {}),
    };
    setBookmarks(prev => [...prev, bookmark]);
    setIsCurrentBookmarked(true);
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
    const current = findBookmarkAt(locationRef.current, progress);
    if (current?.id === bookmark.id) setIsCurrentBookmarked(false);
    await removeBookmark(book.id, bookmark.id);
  }

  return (
    <View style={styles.root}>
      {keepAwake && <KeepAwake />}

      {book.fileType === 'pdf' ? (
        <PdfReader
          ref={readerRef}
          uri={book.fileUri}
          initialPage={book.page}
          onProgress={handleProgress}
          onToggleChrome={() => setChrome(v => !v)}
        />
      ) : book.fileType === 'cbz' ? (
        <CbzReader
          ref={readerRef}
          uri={book.fileUri}
          bookId={book.id}
          archiveFormat={book.archiveFormat}
          initialPage={book.page}
          onProgress={handleProgress}
          onToggleChrome={() => setChrome(v => !v)}
        />
      ) : book.fileType === 'txt' ? (
        <TxtReader
          ref={readerRef}
          uri={book.fileUri}
          startPercent={book.progress}
          onProgress={handleProgress}
          onToggleChrome={() => setChrome(v => !v)}
          fontFamily={getReaderFontFamily(readerFont)}
          fontSize={getReaderFontSizeValue(readerFontSize)}
        />
      ) : (
        <EpubReader
          ref={readerRef}
          uri={book.fileUri}
          startCfi={book.progressCfi}
          onProgress={handleProgress}
          onToggleChrome={() => setChrome(v => !v)}
          fontFamily={getReaderFontFamily(readerFont)}
          fontSize={getReaderFontSizeValue(readerFontSize)}
          flow={readingFlow}
          direction={readingDirection}
        />
      )}

      {warmLight && <View pointerEvents="none" style={styles.warmOverlay} />}

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
              {Math.round(progress * 100)}%
            </Text>
            <Pressable
              onPress={handleToggleBookmark}
              hitSlop={10}
              style={styles.bookmarkBtn}
            >
              <Star
                size={15}
                color={colors.secondary}
                fill={isCurrentBookmarked ? colors.secondary : 'none'}
              />
            </Pressable>
          </View>
          {/*
            Plain tap-to-seek — no PanResponder. Bookmarks are ordinary
            nested Pressables; since nothing here is negotiating/stealing
            the responder mid-gesture, RN resolves each tap to whichever
            view was actually touched (a marker, or the bar itself) on its
            own, no extra plumbing required.
          */}
          <Pressable
            style={styles.trackTouchArea}
            onLayout={e => {
              trackWidthRef.current = e.nativeEvent.layout.width;
            }}
            onPress={handleTrackPress}
          >
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
                  },
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
          </Pressable>
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

const getStyles = colors =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    warmOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,138,36,0.14)',
    },
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
      justifyContent: 'flex-end',
      marginBottom: 4,
    },
    bottomLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
      display: 'none',
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
      backgroundColor: colors.primary,
    },
    marker: {
      position: 'absolute',
      top: '50%',
      marginTop: -5,
      marginLeft: -5,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.secondary,
      borderWidth: 1.5,
      borderColor: colors.card,
    },
  });
