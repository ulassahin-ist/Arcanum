import React from 'react';
import { Text } from 'react-native';

// Applies a font-family to every <Text> in the app without touching every
// screen or wrapping every Text usage. This patches Text's underlying
// render function once (the same trick used by libraries like
// react-native-global-props), then just updates a closed-over variable on
// every setting change — no re-patching needed. Wrapped defensively so a
// future React Native internals change disables the app-font setting
// instead of crashing the app.
let currentFamily;
let patched = false;

export function setGlobalFontFamily(family) {
  currentFamily = family;
  if (patched) return;

  try {
    const originalRender = Text.render;
    if (typeof originalRender !== 'function') return;
    patched = true;

    Text.render = function patchedRender(props, ref) {
      const origin = originalRender.call(this, props, ref);
      if (!currentFamily || !origin) return origin;
      return React.cloneElement(origin, {
        style: [{ fontFamily: currentFamily }, origin.props.style],
      });
    };
  } catch (e) {
    // Silently no-op — the app just keeps the default system font.
  }
}
