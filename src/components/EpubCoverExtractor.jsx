import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// Renders an invisible 1x1 WebView that parses the epub archive just far
// enough to resolve its cover image, then reports back via onResult and
// can be unmounted. Doesn't touch the visible reader/rendition at all.
export default function EpubCoverExtractor({ uri, onResult }) {
  const handled = useRef(false);

  function handleMessage(event) {
    if (handled.current) return;
    let msg;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'cover') {
      handled.current = true;
      onResult(msg.payload?.base64 || null);
    }
  }

  const htmlUri = `file:///android_asset/epub-reader.html?mode=cover&src=${encodeURIComponent(
    'file://' + uri,
  )}`;

  return (
    <WebView
      source={{ uri: htmlUri }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
      style={styles.hidden}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    width: 1,
    height: 1,
  },
});
