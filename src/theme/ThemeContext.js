import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES } from './themes';
import { loadSettings, saveSettings } from './storage';
import { resolveAppFontFamily } from './fonts';
import { setGlobalFontFamily } from './globalFont';

const DEFAULTS = {
  themeName: 'light',
  readerFont: 'original',
  appFont: 'system',
  librarySortOrder: 'recentlyAdded',
  readingFlow: 'paginated', // 'paginated' | 'scrolled'
  readingDirection: 'ltr', // 'ltr' | 'rtl'
  keepAwake: false,
  warmLight: false,
};

const ThemeContext = createContext({
  ...DEFAULTS,
  colors: THEMES.light,
  setThemeName: () => {},
  setReaderFont: () => {},
  setAppFont: () => {},
  setLibrarySortOrder: () => {},
  setReadingFlow: () => {},
  setReadingDirection: () => {},
  setKeepAwake: () => {},
  setWarmLight: () => {},
});

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings().then(s => {
      const merged = { ...DEFAULTS, ...s };
      if (!THEMES[merged.themeName]) merged.themeName = DEFAULTS.themeName;
      setSettings(merged);
      setGlobalFontFamily(resolveAppFontFamily(merged.appFont));
      setReady(true);
    });
  }, []);

  async function patch(partial) {
    setSettings(prev => ({ ...prev, ...partial }));
    await saveSettings(partial);
  }

  async function setThemeName(name) {
    if (!THEMES[name]) return;
    await patch({ themeName: name });
  }

  async function setReaderFont(key) {
    await patch({ readerFont: key });
  }

  async function setAppFont(key) {
    setGlobalFontFamily(resolveAppFontFamily(key));
    await patch({ appFont: key });
  }

  async function setLibrarySortOrder(order) {
    await patch({ librarySortOrder: order });
  }

  async function setReadingFlow(flow) {
    await patch({ readingFlow: flow });
  }

  async function setReadingDirection(direction) {
    await patch({ readingDirection: direction });
  }

  async function setKeepAwake(enabled) {
    await patch({ keepAwake: enabled });
  }

  async function setWarmLight(enabled) {
    await patch({ warmLight: enabled });
  }

  if (!ready) return null; // splash could go here instead

  return (
    <ThemeContext.Provider
      value={{
        ...settings,
        colors: THEMES[settings.themeName],
        setThemeName,
        setReaderFont,
        setAppFont,
        setLibrarySortOrder,
        setReadingFlow,
        setReadingDirection,
        setKeepAwake,
        setWarmLight,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
