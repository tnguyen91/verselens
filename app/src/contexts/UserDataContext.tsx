import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Bookmark } from '../types/bible';
import { isWeb, supportsWebFileAPI, supportsFileSystem } from '../utils/platform';
import { UserDataContextType, UserDataProviderProps } from '../types/contexts';

const STORAGE_KEYS = {
  BOOKMARKS: '@verselens_bookmarks',
  FONT_SIZE: '@verselens_font_size',
  KEEP_SCREEN_ON: '@verselens_keep_screen_on',
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedBookmarks = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
        if (storedBookmarks) {
          const parsedBookmarks = JSON.parse(storedBookmarks);
          const bookmarksWithDates = parsedBookmarks.map((bookmark: any) => ({
            ...bookmark,
            createdAt: new Date(bookmark.createdAt),
          }));
          setBookmarks(bookmarksWithDates);
        }

        const storedFontSize = await AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE);
        if (storedFontSize) {
          setFontSize(parseInt(storedFontSize, 10));
        }

        const storedKeepScreenOn = await AsyncStorage.getItem(STORAGE_KEYS.KEEP_SCREEN_ON);
        if (storedKeepScreenOn) {
          setKeepScreenOn(storedKeepScreenOn === 'true');
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStoredData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    }
  }, [bookmarks, isLoaded]);

  const addBookmark = useCallback((bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const newBookmark: Bookmark = {
      ...bookmarkData,
      id: `bookmark-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
    };
    setBookmarks(prev => [...prev, newBookmark]);
  }, []);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  }, []);

  const updateBookmarkNote = useCallback((bookmarkId: string, note: string) => {
    setBookmarks(prev => prev.map(b => 
      b.id === bookmarkId ? { ...b, note } : b
    ));
  }, []);

  const isBookmarked = useCallback((book: string, chapter: number, verse: number) => {
    return bookmarks.some(b => b.book === book && b.chapter === chapter && b.verse === verse);
  }, [bookmarks]);

  const handleSetFontSize = useCallback(async (size: number) => {
    setFontSize(size);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, size.toString());
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  }, []);

  const handleSetKeepScreenOn = useCallback(async (value: boolean) => {
    setKeepScreenOn(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.KEEP_SCREEN_ON, value.toString());
    } catch (error) {
      console.error('Error saving keep screen on setting:', error);
    }
  }, []);

  const exportData = useCallback(async (): Promise<string> => {
    try {
      const exportData = {
        app: 'VerseLens',
        bookmarks,
        settings: {
          fontSize,
          keepScreenOn,
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          bookmarkCount: bookmarks.length,
          deviceInfo: {
            platform: Platform.OS,
            timestamp: Date.now(),
          }
        }
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }, [bookmarks, fontSize, keepScreenOn]);

  const exportToFile = useCallback(async (): Promise<void> => {
    try {
      const dataString = await exportData();
      const fileName = `verselens-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      if (isWeb) {
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      const file = new File(Paths.document, fileName);
      
      await file.write(dataString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        await Share.share({
          message: dataString,
          title: 'VerseLens Backup',
        });
      }
    } catch (error) {
      console.error('Error exporting to file:', error);
      throw error;
    }
  }, [exportData]);

  const importFromFile = useCallback(async (): Promise<void> => {
    try {
      if (isWeb) {
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = async (event: any) => {
            try {
              const file = event.target.files[0];
              if (!file) return;
              
              const reader = new FileReader();
              reader.onload = async (e) => {
                try {
                  const content = e.target?.result as string;
                  await importData(content);
                  resolve();
                } catch (error) {
                  reject(error);
                }
              };
              reader.readAsText(file);
            } catch (error) {
              reject(error);
            }
          };
          document.body.appendChild(input);
          input.click();
          document.body.removeChild(input);
        });
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const file = new File(fileUri);
        const fileContent = await file.text();
        
        const importedData = JSON.parse(fileContent);
        
        if (importedData.bookmarks) {
          const bookmarksWithDates = importedData.bookmarks.map((bookmark: any) => ({
            ...bookmark,
            createdAt: new Date(bookmark.createdAt),
          }));
          setBookmarks(bookmarksWithDates);
          await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarksWithDates));
        }
        
        const fontSize = importedData.settings?.fontSize || importedData.fontSize;
        const keepScreenOn = importedData.settings?.keepScreenOn || importedData.keepScreenOn;
        
        if (typeof fontSize === 'number') {
          setFontSize(fontSize);
          await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize.toString());
        }
        
        if (typeof keepScreenOn === 'boolean') {
          setKeepScreenOn(keepScreenOn);
          await AsyncStorage.setItem(STORAGE_KEYS.KEEP_SCREEN_ON, keepScreenOn.toString());
        }
      }
    } catch (error) {
      console.error('Error importing from file:', error);
      throw error;
    }
  }, []);

  const importData = useCallback(async (dataString: string): Promise<void> => {
    try {
      const importedData = JSON.parse(dataString);
      
      if (importedData.bookmarks) {
        const bookmarksWithDates = importedData.bookmarks.map((bookmark: any) => ({
          ...bookmark,
          createdAt: new Date(bookmark.createdAt),
        }));
        setBookmarks(bookmarksWithDates);
        await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarksWithDates));
      }
      
      if (typeof importedData.fontSize === 'number') {
        setFontSize(importedData.fontSize);
        await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, importedData.fontSize.toString());
      }
      
      if (typeof importedData.keepScreenOn === 'boolean') {
        setKeepScreenOn(importedData.keepScreenOn);
        await AsyncStorage.setItem(STORAGE_KEYS.KEEP_SCREEN_ON, importedData.keepScreenOn.toString());
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }, []);

  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.FONT_SIZE,
        STORAGE_KEYS.KEEP_SCREEN_ON,
      ]);
      setBookmarks([]);
      setFontSize(18);
      setKeepScreenOn(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        updateBookmarkNote,
        isBookmarked,
        fontSize,
        setFontSize: handleSetFontSize,
        keepScreenOn,
        setKeepScreenOn: handleSetKeepScreenOn,
        isLoaded,
        exportData,
        exportToFile,
        importData,
        importFromFile,
        clearAllData,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
