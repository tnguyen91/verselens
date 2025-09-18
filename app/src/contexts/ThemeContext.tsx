import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ThemeMode, Theme, ThemeContextType, ThemeProviderProps } from '../types/contexts';

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#e9ecef',
    accent: '#6c757d',
    accentLight: '#adb5bd',
    accentDark: '#495057',
    textPrimary: '#212529',
    textSecondary: '#495057',
    textMuted: '#6c757d',
    textDim: '#adb5bd',
    border: 'rgba(0, 0, 0, 0.15)',
    borderLight: 'rgba(0, 0, 0, 0.1)',
    borderHeavy: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    surface: '#ffffff',
    card: '#f8f9fa',
    highlight: '#fff3cd',
    warning: '#ffc107',
    error: '#dc3545',
    success: '#198754',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#000000',
    secondary: '#1a1a1a',
    tertiary: '#2a2a2a',
    accent: '#4a5568',
    accentLight: '#6b7280',
    accentDark: '#374151',
    textPrimary: '#ffffff',
    textSecondary: '#e5e7eb',
    textMuted: '#9ca3af',
    textDim: '#6b7280',
    border: 'rgba(255, 255, 255, 0.15)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    borderHeavy: 'rgba(255, 255, 255, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.6)',
    surface: '#1a1a1a',
    card: '#2a2a2a',
    highlight: '#4a5568',
    warning: '#f59e0b',
    error: '#ef4444',
    success: '#10b981',
  },
};

const themes = {
  light: lightTheme,
  dark: darkTheme,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(darkTheme);

  const setTheme = useCallback((mode: ThemeMode) => {
    setCurrentTheme(themes[mode]);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
