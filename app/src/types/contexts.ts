import { ReactNode } from 'react';
import { Bookmark } from './bible';
import { Translation } from './services';

export interface BibleContextType {
  currentTranslation: Translation;
  availableTranslations: Translation[];
  remoteTranslations: string[];
  selectedBook: string;
  selectedChapter: number;
  setTranslation: (translationId: string) => Promise<void>;
  setBook: (book: string) => void;
  setChapter: (chapter: number) => void;
  getCurrentVerses: () => [string, string][];
  isLoading: boolean;
  loadingRemoteTranslation: boolean;
}

export interface BibleProviderProps {
  children: ReactNode;
}

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textDim: string;
    border: string;
    borderLight: string;
    borderHeavy: string;
    overlay: string;
    overlayLight: string;
    surface: string;
    card: string;
    highlight: string;
    warning: string;
    error: string;
    success: string;
  };
}

export interface ThemeContextType {
  theme: Theme;
  setTheme: (mode: ThemeMode) => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export interface UserDataContextType {
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (bookmarkId: string) => void;
  updateBookmarkNote: (bookmarkId: string, note: string) => void;
  isBookmarked: (book: string, chapter: number, verse: number) => boolean;

  fontSize: number;
  setFontSize: (size: number) => void;
  keepScreenOn: boolean;
  setKeepScreenOn: (value: boolean) => void;

  isLoaded: boolean;

  exportData: () => Promise<string>;
  exportToFile: () => Promise<void>;
  importData: (data: string) => Promise<void>;
  importFromFile: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

export interface UserDataProviderProps {
  children: ReactNode;
}

export interface TranslationModeContextType {
  translationMode: boolean;
  setTranslationMode: (enabled: boolean) => void;
  toggleTranslationMode: () => void;
}

export interface TranslationModeProviderProps {
  children: ReactNode;
}