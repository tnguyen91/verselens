import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, Text } from 'react-native';
import { BibleProvider, useBible } from './contexts/BibleContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { UserDataProvider, useUserData } from './contexts/UserDataContext';
import { TranslationModeProvider } from './contexts/TranslationModeContext';
import { TabNavigator, TabKey } from './components/TabNavigator';
import { BibleReader } from './screens/BibleReader';
import { Search } from './screens/Search';
import { Bookmarks } from './screens/Bookmarks';
import { Settings } from './screens/Settings';

const AppContent: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const { setBook, setChapter } = useBible();
  const { 
    bookmarks, 
    removeBookmark, 
    updateBookmarkNote,
    isLoaded
  } = useUserData();
  
  const [activeTab, setActiveTab] = useState<TabKey>('bible');

  const handleVerseSelect = useCallback((book: string, chapter: number) => {
    setBook(book);
    setChapter(chapter);
    setActiveTab('bible');
  }, [setBook, setChapter]);

  const handleDeleteBookmark = useCallback((bookmarkId: string) => {
    removeBookmark(bookmarkId);
  }, [removeBookmark]);

  const handleAddNote = useCallback((bookmarkId: string, note: string) => {
    updateBookmarkNote(bookmarkId, note);
  }, [updateBookmarkNote]);

  const renderActiveScreen = useCallback(() => {
    switch (activeTab) {
      case 'bible':
        return <BibleReader />;
      case 'search':
        return <Search onVerseSelect={handleVerseSelect} />;
      case 'bookmarks':
        return (
          <Bookmarks
            bookmarks={bookmarks}
            onVerseSelect={handleVerseSelect}
            onDeleteBookmark={handleDeleteBookmark}
            onAddNote={handleAddNote}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <BibleReader />;
    }
  }, [activeTab, handleVerseSelect, bookmarks, handleDeleteBookmark, handleAddNote]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.primary }]}>
        <StatusBar
          barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.primary}
        />
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
          Loading your settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.primary}
      />
      
      <View style={styles.content}>
        {renderActiveScreen()}
      </View>
      
      <TabNavigator activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
});

AppContent.displayName = 'AppContent';

export const VerseLensApp: React.FC = () => {
  return (
    <ThemeProvider>
      <TranslationModeProvider>
        <BibleProvider>
          <UserDataProvider>
            <AppContent />
          </UserDataProvider>
        </BibleProvider>
      </TranslationModeProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
