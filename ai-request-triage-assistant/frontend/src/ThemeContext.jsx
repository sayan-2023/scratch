import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme';

const ColorModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
  isDark: false,
});

export const useColorMode = () => useContext(ColorModeContext);

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem('triage_theme_mode');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Check system preference
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback
    }
    return 'light';
  });

  // Sync to document element data-theme for any pure CSS rules
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', mode);
      document.documentElement.style.colorScheme = mode;
    } catch {
      // ignore
    }
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('triage_theme_mode', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const setColorMode = (newMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setMode(newMode);
      try {
        localStorage.setItem('triage_theme_mode', newMode);
      } catch {
        // ignore
      }
    }
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
      setColorMode,
      isDark: mode === 'dark',
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

