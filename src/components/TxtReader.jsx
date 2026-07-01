import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';

// Plain-text books have no internal structure to seek by (no CFI, no
// page count) — progress is just how far down the scroll view the
// reader is, same model most text readers use for unstructured content.
const TxtReader = forwardRef(function TxtReader(
  {
    uri,
    startPercent,
    onProgress,
    onToggleChrome,
    fontFamily,
    fontSize = 100,
  },
  ref,
) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const scrollRef = useRef(null);
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);
  const pendingSeekRef = useRef(startPercent || 0);
  const [text, setText] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    RNFS.readFile(uri, 'utf8')
      .then(content => {
        if (active) setText(content);
      })
      .catch(e => {
        if (active) setError(e.message || "Couldn't open this file.");
      });
    return () => {
      active = false;
    };
  }, [uri]);

  function maybeApplyPendingSeek() {
    const scrollable = contentHeightRef.current - layoutHeightRef.current;
    if (scrollable <= 0 || !pendingSeekRef.current) return;
    scrollRef.current?.scrollTo({
      y: pendingSeekRef.current * scrollable,
      animated: false,
    });
    pendingSeekRef.current = 0;
  }

  useImperativeHandle(ref, () => ({
    seekTo({ percent }) {
      const scrollable = contentHeightRef.current - layoutHeightRef.current;
      if (scrollable <= 0) {
        pendingSeekRef.current = percent || 0;
        return;
      }
      scrollRef.current?.scrollTo({
        y: (percent || 0) * scrollable,
        animated: true,
      });
    },
  }));

  function handleScroll(e) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    const percent = scrollable > 0 ? contentOffset.y / scrollable : 0;
    const clamped = Math.min(Math.max(percent, 0), 1);
    onProgress(clamped, clamped);
  }

  const fontSizePx = 15 * (fontSize / 100);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text, textAlign: 'center', padding: 16 }}>
          Couldn't open this book.{'\n'}
          {error}
        </Text>
      </View>
    );
  }

  if (text === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Pressable style={styles.fill} onPress={onToggleChrome}>
      <ScrollView
        ref={scrollRef}
        style={styles.fill}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        onContentSizeChange={(w, h) => {
          contentHeightRef.current = h;
          maybeApplyPendingSeek();
        }}
        onLayout={e => {
          layoutHeightRef.current = e.nativeEvent.layout.height;
          maybeApplyPendingSeek();
        }}
      >
        <Text
          style={[
            styles.text,
            { fontFamily, fontSize: fontSizePx, lineHeight: fontSizePx * 1.6 },
          ]}
        >
          {text}
        </Text>
      </ScrollView>
    </Pressable>
  );
});

export default TxtReader;

const getStyles = colors =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: colors.readerBg },
    center: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: { padding: 20, paddingBottom: 80 },
    text: { color: colors.readerText },
  });
