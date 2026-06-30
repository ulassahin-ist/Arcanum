import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeContext';

const EpubReader = forwardRef(function EpubReader(
  {
    uri,
    startCfi, // <-- was `initialProgress`, and unused
    onProgress,
    onToggleChrome,
  },
  ref,
) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const webRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  const [renditionReady, setRenditionReady] = useState(false);

  useImperativeHandle(ref, () => ({
    seekTo({ percent, cfi }) {
      webRef.current?.postMessage(
        JSON.stringify({ type: 'seek', payload: { percent, cfi } }),
      );
    },
  }));

  function sendTheme() {
    webRef.current?.postMessage(
      JSON.stringify({
        type: 'theme',
        payload: { bg: colors.readerBg, text: colors.readerText },
      }),
    );
  }

  function handleMessage(event) {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'progress')
      onProgress(msg.payload.percent || 0, msg.payload.cfi);
    if (msg.type === 'toggleChrome') onToggleChrome();
    if (msg.type === 'loadError') {
      setLoadError(msg.payload.message);
    }
    if (msg.type === 'ready') {
      setRenditionReady(true);
    }
  }

  // The book's rendition only exists inside the WebView after it reports
  // 'ready', and the theme has to be (re)sent any time it's available or
  // the app theme changes (e.g. user switches theme mid-read).
  useEffect(() => {
    if (renditionReady) sendTheme();
  }, [renditionReady, colors.readerBg, colors.readerText]);

  const htmlUri = `file:///android_asset/epub-reader.html?src=${encodeURIComponent(
    'file://' + uri,
  )}${startCfi ? `&cfi=${encodeURIComponent(startCfi)}` : ''}`;

  if (loadError) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: colors.text, textAlign: 'center', padding: 16 }}>
          Couldn't open this book.{'\n'}
          {loadError}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.fill}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ uri: htmlUri }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        style={styles.fill}
      />
    </View>
  );
});

export default EpubReader;

const getStyles = colors => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
