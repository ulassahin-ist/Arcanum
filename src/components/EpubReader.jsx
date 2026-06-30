import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeContext';

export default function EpubReader({
  uri,
  startCfi, // <-- was `initialProgress`, and unused
  onProgress,
  onToggleChrome,
}) {
  const { colors } = useTheme();
  const webRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  function handleMessage(event) {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'progress')
      onProgress(msg.payload.percent || 0, msg.payload.cfi);
    if (msg.type === 'toggleChrome') onToggleChrome();
    if (msg.type === 'loadError') {
      setLoadError(msg.payload.message);
    }
  }

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
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
