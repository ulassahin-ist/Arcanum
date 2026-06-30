import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES } from './colors';
import { loadSettings, saveSettings } from './storage';

const ThemeContext = createContext({
  themeName: 'light',
  colors: THEMES.light,
  setThemeName: () => {},
});

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings().then(s => {
      if (s.themeName && THEMES[s.themeName]) setThemeNameState(s.themeName);
      setReady(true);
    });
  }, []);

  async function setThemeName(name) {
    if (!THEMES[name]) return;
    setThemeNameState(name);
    await saveSettings({ themeName: name });
  }

  if (!ready) return null; // splash could go here instead

  return (
    <ThemeContext.Provider
      value={{ themeName, colors: THEMES[themeName], setThemeName }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
