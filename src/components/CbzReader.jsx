import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';
import { ensureCbzPagesExtracted } from '../storage/cbz';

const CbzReader = forwardRef(function CbzReader(
  { uri, bookId, initialPage, onProgress, onToggleChrome },
  ref,
) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const pagerRef = useRef(null);
  const [pages, setPages] = useState(null); // null while unpacking
  const [error, setError] = useState(null);
  const startIndex = Math.max(0, (initialPage || 1) - 1);

  useEffect(() => {
    let active = true;
    ensureCbzPagesExtracted(uri, bookId)
      .then(list => {
        if (active) setPages(list);
      })
      .catch(e => {
        if (active) setError(e.message || 'Could not open this comic.');
      });
    return () => {
      active = false;
    };
  }, [uri, bookId]);

  useImperativeHandle(ref, () => ({
    seekTo({ percent, page }) {
      if (!pages || pages.length === 0) return;
      const target =
        page != null
          ? Math.min(Math.max(page - 1, 0), pages.length - 1)
          : Math.min(
              Math.max(Math.round((percent || 0) * (pages.length - 1)), 0),
              pages.length - 1,
            );
      pagerRef.current?.setPage(target);
    },
  }));

  function handlePageSelected(e) {
    const index = e.nativeEvent.position;
    if (!pages || pages.length <= 1) {
      onProgress(pages && pages.length === 1 ? 1 : 0, index + 1);
      return;
    }
    onProgress(index / (pages.length - 1), index + 1);
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text, textAlign: 'center', padding: 16 }}>
          Couldn't open this comic.{'\n'}
          {error}
        </Text>
      </View>
    );
  }

  if (!pages) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <PagerView
      ref={pagerRef}
      style={styles.fill}
      initialPage={startIndex}
      onPageSelected={handlePageSelected}
    >
      {pages.map((pageUri, i) => (
        <Pressable key={i} style={styles.page} onPress={onToggleChrome}>
          <Image
            source={{ uri: pageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>
      ))}
    </PagerView>
  );
});

export default CbzReader;

const getStyles = colors =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: colors.bg },
    center: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    page: { flex: 1, backgroundColor: '#000' },
    image: { flex: 1, width: '100%', height: '100%' },
  });
