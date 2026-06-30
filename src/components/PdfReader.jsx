import React, { useRef } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Pdf from 'react-native-pdf';
import { C } from '../theme/colors';

export default function PdfReader({ uri, onProgress, onToggleChrome }) {
  const totalPages = useRef(1);

  return (
    <Pressable style={styles.fill} onPress={onToggleChrome}>
      <Pdf
        source={{ uri, cache: true }}
        style={styles.fill}
        enablePaging
        horizontal
        onLoadComplete={numberOfPages => {
          totalPages.current = numberOfPages;
        }}
        onPageChanged={page => {
          onProgress(page / totalPages.current);
        }}
        onError={err => console.warn('PDF load error', err)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
});
