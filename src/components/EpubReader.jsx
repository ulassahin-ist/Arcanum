import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { C } from '../theme/colors';

export default function EpubReader({
  uri,
  initialProgress,
  onProgress,
  onToggleChrome,
}) {
  const webRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  function handleMessage(event) {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'progress') onProgress(msg.payload.percent || 0);
    if (msg.type === 'toggleChrome') onToggleChrome();
    if (msg.type === 'loadError') {
      setLoadError(msg.payload.message);
    }
  }
  // pass the file path as a query param instead of posting the file content
  const htmlUri = `file:///android_asset/epub-reader.html?src=${encodeURIComponent(
    'file://' + uri,
  )}`;

  if (loadError) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: C.text, textAlign: 'center', padding: 16 }}>
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
  fill: { flex: 1, backgroundColor: C.bg },
});
