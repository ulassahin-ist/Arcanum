import { Platform } from 'react-native';

// --- Reader (EPUB) fonts ---
// Sent straight into the WebView as CSS `font-family` values. Generic
// keywords ('serif', 'sans-serif', 'monospace') are resolved by the WebView
// itself to each platform's own font (Roboto/Droid Serif/Droid Sans Mono on
// Android, San Francisco / a Georgia-class serif / a Menlo-class mono on
// iOS) — so no font files need to be bundled or linked natively.
// `family: null` means "don't override" — the book keeps its own embedded
// typeface, exactly like today's behavior.
export const READER_FONTS = [
  { key: 'original', label: 'Original', family: null },
  { key: 'sans', label: 'Sans Serif', family: 'sans-serif' },
  { key: 'serif', label: 'Serif', family: 'serif' },
  { key: 'mono', label: 'Monospace', family: 'monospace' },
];

export function getReaderFontFamily(key) {
  const entry = READER_FONTS.find(f => f.key === key);
  return entry ? entry.family : null;
}

// --- Reader (EPUB) font size ---
// Sent to the WebView as a percentage the epub.js rendition scales its
// base font-size by (rendition.themes.fontSize('<value>%')). 100 is the
// book's normal size.
export const READER_FONT_SIZES = [
  { key: 'xs', label: 'XS', value: 80 },
  { key: 'sm', label: 'S', value: 90 },
  { key: 'md', label: 'M', value: 100 },
  { key: 'lg', label: 'L', value: 115 },
  { key: 'xl', label: 'XL', value: 130 },
  { key: 'xxl', label: 'XXL', value: 150 },
];

export function getReaderFontSizeValue(key) {
  const entry = READER_FONT_SIZES.find(f => f.key === key);
  return entry ? entry.value : 100;
}

// --- App-wide UI font ---
// Native <Text> needs a real per-platform font name rather than a CSS
// keyword, so each option is mapped explicitly. 'System' resolves to
// `undefined`, i.e. React Native's own default.
//
// 'Inter' is not a system font on Android or iOS, so it has to be bundled
// as an actual font file and referenced by that file's name:
//   Android: drop Inter-Regular.ttf (and any weights you want, e.g.
//            Inter-Bold.ttf) into android/app/src/main/assets/fonts/ —
//            Android picks it up automatically from the filename, no
//            linking step needed.
//   iOS:     add the .ttf to the Xcode project and list it under
//            "Fonts provided by application" (UIAppFonts) in Info.plist.
// This app targets Android only, so only the Android asset is required.
export const APP_FONTS = [
  {
    key: 'inter',
    label: 'Inter',
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
  },
  { key: 'system', label: 'System', ios: 'System', android: 'sans-serif' },
  { key: 'serif', label: 'Literary', ios: 'Georgia', android: 'serif' },
  { key: 'mono', label: 'Mono', ios: 'Courier', android: 'monospace' },
  {
    key: 'condensed',
    label: 'Condensed',
    // iOS has no built-in condensed generic; fall back to System there.
    ios: 'System',
    android: 'sans-serif-condensed',
  },
];

export function resolveAppFontFamily(key) {
  const entry = APP_FONTS.find(f => f.key === key) || APP_FONTS[0];
  const family = Platform.OS === 'ios' ? entry.ios : entry.android;
  return family === 'System' ? undefined : family;
}
