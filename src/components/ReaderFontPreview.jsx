import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// Same rendering engine the real reader uses (a WebView), so this preview
// is a true match for what the book will actually look like — not just an
// approximation via a native <Text>.
const SAMPLE_TEXT =
  'The lighthouse keeper climbed the spiral stairs one last time, counting each step the way he always had — a hundred and twelve — then the cold sweep of the lamp, and the sea beyond it, endless and patient.';

export default function ReaderFontPreview({ bg, text, fontFamily, height = 118 }) {
  const html = useMemo(() => {
    const family = fontFamily || '-apple-system, Roboto, sans-serif';
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; background: ${bg}; }
  p {
    margin: 0;
    padding: 16px;
    color: ${text};
    font-family: ${family};
    font-size: 15px;
    line-height: 1.6;
  }
</style></head>
<body><p>${SAMPLE_TEXT}</p></body></html>`;
  }, [bg, text, fontFamily]);

  return (
    <View style={[styles.wrap, { height, backgroundColor: bg }]}>
      <WebView
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        originWhitelist={['*']}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  web: { flex: 1, backgroundColor: 'transparent' },
});
