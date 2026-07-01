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

// --- App-wide UI font ---
// Native <Text> needs a real per-platform font name rather than a CSS
// keyword, so each option is mapped explicitly. 'System' resolves to
// `undefined`, i.e. React Native's own default.
export const APP_FONTS = [
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
