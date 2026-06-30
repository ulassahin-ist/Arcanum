import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Pdf from 'react-native-pdf';
import { useTheme } from '../theme/ThemeContext';

const PdfReader = forwardRef(function PdfReader(
  { uri, initialPage, onProgress, onToggleChrome },
  ref,
) {
  const totalPages = useRef(1);
  const pdfRef = useRef(null);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  useImperativeHandle(ref, () => ({
    seekTo({ percent, page }) {
      const target =
        page != null
          ? page
          : Math.max(1, Math.round((percent || 0) * totalPages.current));
      pdfRef.current?.setPage(target);
    },
  }));

  return (
    <Pdf
      ref={pdfRef}
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
});

export default PdfReader;

const getStyles = colors =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: colors.bg },
  });
