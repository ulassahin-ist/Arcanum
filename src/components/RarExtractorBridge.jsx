import React, { useRef, useEffect, useState } from 'react';
import { Modal, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  registerRarWebView,
  unregisterRarWebView,
  handleRarBridgeMessage,
  subscribeToMountState,
} from '../storage/rarBridge';

export default function RarExtractorBridge() {
  const webRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => subscribeToMountState(setActive), []);

  useEffect(() => {
    if (!active) return;
    return () => unregisterRarWebView(webRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => {}}
    >
      <WebView
        ref={r => {
          webRef.current = r;
          registerRarWebView(r);
        }}
        source={{ uri: 'file:///android_asset/rar-extractor.html' }}
        onMessage={e => handleRarBridgeMessage(e.nativeEvent.data)}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        style={styles.hidden}
        pointerEvents="none"
        focusable={false}
        keyboardDisplayRequiresUserAction={false}
        androidLayerType={Platform.OS === 'android' ? 'software' : undefined}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  hidden: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
