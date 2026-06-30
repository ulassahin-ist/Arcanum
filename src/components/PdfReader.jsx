import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import Pdf from 'react-native-pdf';
import { C } from '../theme/colors';

export default function PdfReader({
  uri,
  initialPage,
  onProgress,
  onToggleChrome,
}) {
  const totalPages = useRef(1);

  return (
    <Pdf
      source={{ uri, cache: false }}
      style={styles.fill}
      enablePaging
      horizontal
      page={initialPage || 1}
      fitPolicy={0}
      onPageSingleTap={onToggleChrome}
      onLoadComplete={numberOfPages => {
        totalPages.current = numberOfPages;
      }}
      onPageChanged={page => {
        onProgress(page / totalPages.current, page);
      }}
      onError={err => console.warn('PDF load error', err)}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
});
