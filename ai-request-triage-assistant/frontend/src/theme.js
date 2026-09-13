import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3b82f6' : '#2563eb', // Vibrant sapphire / Modern indigo
        light: '#60a5fa',
        dark: '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#a855f7' : '#7c3aed', // Purple accent
        light: '#c084fc',
        dark: '#6b21a8',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0b0f19' : '#f8fafc', // Obsidian / Crisp slate
        paper: isDark ? '#111827' : '#ffffff',   // Slate 900 card / Pure white
      },
      error: {
        main: isDark ? '#f87171' : '#dc2626',
        light: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      },
      warning: {
        main: isDark ? '#fbbf24' : '#d97706',
        light: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
      },
      info: {
        main: isDark ? '#38bdf8' : '#0284c7',
        light: isDark ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff',
      },
      success: {
        main: isDark ? '#34d399' : '#16a34a',
        light: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '100vh',
            backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
            color: isDark ? '#f8fafc' : '#0f172a',
          },
          '*, *::before, *::after': {
            transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 14px rgba(59, 130, 246, 0.25)'
                : '0 4px 12px rgba(37, 99, 235, 0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            boxShadow: isDark
              ? '0 4px 20px -2px rgba(0, 0, 0, 0.5)'
              : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 6,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
  });
};

const defaultTheme = createAppTheme('light');
export default defaultTheme;
