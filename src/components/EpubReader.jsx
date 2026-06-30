import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { C } from '../theme/colors';

export default function EpubReader({ uri, onProgress, onToggleChrome }) {
  const webRef = useRef(null);
  const [base64, setBase64] = useState(null);

  useEffect(() => {
    RNFS.readFile(uri, 'base64').then(setBase64);
  }, [uri]);

  function handleMessage(event) {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'ready' && base64) {
      webRef.current.postMessage(
        JSON.stringify({ type: 'load', payload: { base64 } }),
      );
    }
    if (msg.type === 'progress') {
      onProgress(msg.payload.percent || 0);
    }
    if (msg.type === 'toggleChrome') {
      onToggleChrome();
    }
  }

  // re-send load once base64 is ready, in case webview loaded first
  useEffect(() => {
    if (base64 && webRef.current) {
      webRef.current.postMessage(
        JSON.stringify({ type: 'load', payload: { base64 } }),
      );
    }
  }, [base64]);

  if (!base64) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.blue} />
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ uri: 'file:///android_asset/epub-reader.html' }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      style={styles.fill}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
});
