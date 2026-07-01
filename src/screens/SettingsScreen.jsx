import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowUpDown,
  BookOpenText,
  HardDrive,
  MoveHorizontal,
  Sun,
  Trash2,
  Watch,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { THEMES, THEME_NAMES } from '../theme/themes';
import {
  APP_FONTS,
  READER_FONTS,
  READER_FONT_SIZES,
  getReaderFontSizeValue,
  resolveAppFontFamily,
} from '../theme/fonts';
import { RADIUS, SPACING } from '../theme/spacing';
import PillSelector from '../components/PillSelector';
import ToggleRow from '../components/ToggleRow';
import ReaderFontPreview from '../components/ReaderFontPreview';
import ThemeContrastPreview from '../components/ThemeContrastPreview';
import ConfirmDialog from '../components/ConfirmDialog';
import { getStorageInfo, clearCoverCache } from '../storage/library';

const READER_FONT_OPTIONS = READER_FONTS.map(f => ({
  key: f.key,
  label: f.label,
}));

const READER_FONT_SIZE_OPTIONS = READER_FONT_SIZES.map(f => ({
  key: f.key,
  label: f.label,
}));

const SORT_OPTIONS = [
  { key: 'recentlyAdded', label: 'Recently Added' },
  { key: 'recentlyRead', label: 'Recently Read' },
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
];

const FLOW_OPTIONS = [
  { key: 'paginated', label: 'Paginated' },
  { key: 'scrolled', label: 'Scroll' },
];

const DIRECTION_OPTIONS = [
  { key: 'ltr', label: 'Left to Right' },
  { key: 'rtl', label: 'Right to Left' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    themeName,
    colors,
    setThemeName,
    readerFont,
    setReaderFont,
    readerFontSize,
    setReaderFontSize,
    appFont,
    setAppFont,
    librarySortOrder,
    setLibrarySortOrder,
    readingFlow,
    setReadingFlow,
    readingDirection,
    setReadingDirection,
    keepAwake,
    setKeepAwake,
    warmLight,
    setWarmLight,
  } = useTheme();
  const styles = getStyles(colors);

  const [storageInfo, setStorageInfo] = useState(null);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);

  const loadStorageInfo = useCallback(() => {
    getStorageInfo().then(setStorageInfo);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStorageInfo();
    }, [loadStorageInfo]),
  );

  async function handleConfirmClear() {
    setClearConfirmVisible(false);
    await clearCoverCache();
    loadStorageInfo();
  }

  const themeOptions = THEME_NAMES.map(name => ({
    key: name,
    label: THEMES[name].name,
    dot: THEMES[name].primary,
  }));

  const appFontOptions = APP_FONTS.map(f => ({
    key: f.key,
    label: f.label,
    fontFamily: resolveAppFontFamily(f.key),
  }));

  const readerFontEntry = READER_FONTS.find(f => f.key === readerFont);
  const readerFontFamily = readerFontEntry ? readerFontEntry.family : null;
  const readerFontSizeValue = getReaderFontSizeValue(readerFontSize);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      {/* --- Reader font --- */}
      <Text style={styles.sectionLabel}>Reader Font</Text>
      <ReaderFontPreview
        bg={colors.readerBg}
        text={colors.readerText}
        fontFamily={readerFontFamily}
        fontSize={readerFontSizeValue}
      />
      <PillSelector
        options={READER_FONT_OPTIONS}
        value={readerFont}
        onChange={setReaderFont}
      />

      <Text style={[styles.subLabel, styles.fontSizeLabel]}>Font Size</Text>
      <PillSelector
        options={READER_FONT_SIZE_OPTIONS}
        value={readerFontSize}
        onChange={setReaderFontSize}
      />
      <Text style={styles.hint}>Applies to EPUB books only</Text>

      {/* --- Theme --- */}
      <Text style={styles.sectionLabel}>Theme</Text>
      <ThemeContrastPreview colors={colors} />
      <PillSelector
        options={themeOptions}
        value={themeName}
        onChange={setThemeName}
      />

      {/* --- App font --- */}
      <Text style={styles.sectionLabel}>App Font</Text>
      <View style={styles.appFontPreview}>
        <Text
          style={[
            styles.appFontPreviewTitle,
            { fontFamily: resolveAppFontFamily(appFont) },
          ]}
        >
          Arcanum
        </Text>
        <Text
          style={[
            styles.appFontPreviewBody,
            { fontFamily: resolveAppFontFamily(appFont) },
          ]}
        >
          This is how menus, titles, and buttons will look.
        </Text>
      </View>
      <PillSelector
        options={appFontOptions}
        value={appFont}
        onChange={setAppFont}
      />

      {/* --- Reading preferences --- */}
      <Text style={styles.sectionLabel}>Reading</Text>

      <View style={styles.subGroup}>
        <View style={styles.subLabelRow}>
          <BookOpenText size={14} color={colors.textMuted} />
          <Text style={styles.subLabel}>Page-turn style</Text>
        </View>
        <PillSelector
          options={FLOW_OPTIONS}
          value={readingFlow}
          onChange={setReadingFlow}
        />
      </View>

      <View style={styles.subGroup}>
        <View style={styles.subLabelRow}>
          <MoveHorizontal size={14} color={colors.textMuted} />
          <Text style={styles.subLabel}>Reading direction</Text>
        </View>
        <PillSelector
          options={DIRECTION_OPTIONS}
          value={readingDirection}
          onChange={setReadingDirection}
        />
      </View>

      <ToggleRow
        icon={<Watch size={15} color={colors.textMuted} />}
        title="Keep screen awake"
        subtitle="Stay on while reading, even without touching the screen"
        value={keepAwake}
        onChange={setKeepAwake}
      />

      <ToggleRow
        icon={<Sun size={15} color={colors.textMuted} />}
        title="Warm night filter"
        subtitle="Adds a warm tint over the page for easier night reading"
        value={warmLight}
        onChange={setWarmLight}
      />

      {/* --- Library --- */}
      <Text style={styles.sectionLabel}>Library</Text>

      <View style={styles.subGroup}>
        <View style={styles.subLabelRow}>
          <ArrowUpDown size={14} color={colors.textMuted} />
          <Text style={styles.subLabel}>Default sort order</Text>
        </View>
        <PillSelector
          options={SORT_OPTIONS}
          value={librarySortOrder}
          onChange={setLibrarySortOrder}
        />
      </View>

      <View style={styles.storageRow}>
        <View style={styles.titleRow}>
          <HardDrive size={15} color={colors.textMuted} />
          <View>
            <Text style={styles.storageTitle}>Storage</Text>
            <Text style={styles.storageSub}>
              {storageInfo
                ? `${formatBytes(
                    storageInfo.booksBytes,
                  )} books \u00b7 ${formatBytes(
                    storageInfo.coversBytes,
                  )} covers`
                : 'Calculating\u2026'}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.clearBtn}
          onPress={() => setClearConfirmVisible(true)}
          hitSlop={8}
        >
          <Trash2 size={13} color={colors.danger} />
          <Text style={styles.clearBtnLabel}>Clear cache</Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={clearConfirmVisible}
        title="Clear cover cache?"
        message="Cached EPUB cover thumbnails will be regenerated automatically next time your library loads. Books themselves aren't affected."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmClear}
        onCancel={() => setClearConfirmVisible(false)}
      />
    </ScrollView>
  );
}

const getStyles = colors =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 20 },
    title: {
      fontSize: 24,
      fontWeight: '800',
      marginTop: 12,
      marginBottom: 24,
      color: colors.text,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 22,
      marginBottom: 10,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 10,
      lineHeight: 16,
    },
    appFontPreview: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      marginBottom: 14,
    },
    appFontPreviewTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    appFontPreviewBody: {
      fontSize: 13,
      color: colors.textSub,
    },
    subGroup: { marginBottom: SPACING.md },
    subLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    subLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
    fontSizeLabel: { marginTop: 14, marginBottom: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    storageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
    },
    storageTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    storageSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    clearBtnLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.danger,
    },
  });
