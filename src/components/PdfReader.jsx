import React, { useRef } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Pdf from 'react-native-pdf';
import { C } from '../theme/colors';

export default function PdfReader({ uri, onProgress, onToggleChrome }) {
  const totalPages = useRef(1);

  return (
    <Pdf
      source={{ uri, cache: false }}
      fitPolicy={0}
      style={styles.fill}
      enablePaging
      horizontal
      onPageSingleTap={onToggleChrome}
      onLoadComplete={n => (totalPages.current = n)}
      onPageChanged={page => onProgress(page / totalPages.current)}
      onError={err => console.warn('PDF load error', err)}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
});
