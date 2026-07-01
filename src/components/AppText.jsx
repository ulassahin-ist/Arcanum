import React from 'react';
import { Text as RNText } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { resolveAppFontFamily } from '../theme/fonts';

// Drop-in replacement for React Native's <Text> that actually applies the
// user's chosen "App Font" setting.
//
// Why this exists: the old approach (src/theme/globalFont.js) tried to
// patch every <Text> at once by overwriting a static `Text.render` method
// — a trick that only ever worked on old, class-based versions of RN's
// Text component. Current RN's <Text> is a plain forwardRef function
// component with no `.render` static, so that patch silently found
// nothing to patch (wrapped in a try/catch specifically so it wouldn't
// crash) and the font setting never did anything.
//
// Every screen/component already imports `Text` from one place, so the
// version-proof fix is to swap what that import points to instead of
// relying on undocumented internals. Any fontFamily set explicitly on a
// given <Text> (e.g. the font-preview pills in Settings) still wins, since
// it's merged in after the app-wide default.
const AppText = React.forwardRef(function AppText({ style, ...rest }, ref) {
  const { appFont } = useTheme();
  const family = resolveAppFontFamily(appFont);
  return (
    <RNText
      ref={ref}
      {...rest}
      style={family ? [{ fontFamily: family }, style] : style}
    />
  );
});

export default AppText;
export { AppText as Text };
