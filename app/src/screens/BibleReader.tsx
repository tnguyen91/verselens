import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { useBible } from '../contexts/BibleContext';
import { useUserData } from '../contexts/UserDataContext';
import { BibleVerse } from '../components/BibleVerse';
import { BibleHeader } from '../components/BibleHeader';
import { BibleNavigation } from '../components/BibleNavigation';
import { BibleDataService } from '../services/BibleDataService';
import { Alert } from '../utils/alert';

export const BibleReader = React.memo(() => {
  const { theme } = useTheme();
  const { 
    currentTranslation, 
    selectedBook, 
    selectedChapter, 
    setBook, 
    setChapter, 
    getCurrentVerses 
  } = useBible();
  
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked
  } = useUserData();

  const flatListRef = useRef<FlatList>(null);

  const currentVerseEntries = useMemo(() => getCurrentVerses(), [getCurrentVerses]);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: 80,
    offset: 80 * index,
    index,
  }), []);

  const navigateToNextChapter = useCallback(() => {
    const nextChapter = BibleDataService.getNextChapter(selectedBook, selectedChapter, currentTranslation.data);
    if (nextChapter) {
      setBook(nextChapter.book);
      setChapter(nextChapter.chapter);
      scrollToTop();
    }
  }, [selectedBook, selectedChapter, currentTranslation.data, setBook, setChapter, scrollToTop]);

  const navigateToPreviousChapter = useCallback(() => {
    const previousChapter = BibleDataService.getPreviousChapter(selectedBook, selectedChapter, currentTranslation.data);
    if (previousChapter) {
      setBook(previousChapter.book);
      setChapter(previousChapter.chapter);
      scrollToTop();
    }
  }, [selectedBook, selectedChapter, currentTranslation.data, setBook, setChapter, scrollToTop]);

  const handleBookmarkToggle = useCallback((verse: number, text: string) => {
    const bookmarked = isBookmarked(selectedBook, selectedChapter, verse);

    if (bookmarked) {
      const existingBookmark = bookmarks.find(
        b => b.book === selectedBook && b.chapter === selectedChapter && b.verse === verse
      );
      if (existingBookmark) {
        removeBookmark(existingBookmark.id);
        Alert.alert('Bookmark Removed', `${selectedBook} ${selectedChapter}:${verse} removed from bookmarks`);
      }
    } else {
      addBookmark({
        book: selectedBook,
        chapter: selectedChapter,
        verse,
        text,
      });
      Alert.alert('Bookmarked', `${selectedBook} ${selectedChapter}:${verse} added to bookmarks`);
    }
  }, [selectedBook, selectedChapter, isBookmarked, bookmarks, removeBookmark, addBookmark]);

  const renderVerseItem = useCallback(({ item: [verseNumber, verseText] }: { item: [string, string] }) => {
    const verse = parseInt(verseNumber);
    const bookmarked = isBookmarked(selectedBook, selectedChapter, verse);

    return (
      <BibleVerse
        verseNumber={verseNumber}
        verseText={verseText}
        isBookmarked={bookmarked}
        onBookmarkToggle={handleBookmarkToggle}
      />
    );
  }, [
    selectedBook, 
    selectedChapter, 
    isBookmarked,
    handleBookmarkToggle
  ]);

  const AppWrapper = Platform.OS === 'web' ? View : GestureHandlerRootView;

  return (
    <AppWrapper style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <BibleHeader />

        <FlatList
          ref={flatListRef}
          data={currentVerseEntries}
          keyExtractor={([verseNumber]) => `${selectedBook}-${selectedChapter}-${verseNumber}`}
          renderItem={renderVerseItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.verseList}
          ListHeaderComponent={<View style={{ height: 16 }} />}
          ListFooterComponent={<View style={{ height: 120 }} />}
          onScrollToIndexFailed={(error) => {
            console.warn('Scroll to index failed:', error);
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={21}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
        />

        <BibleNavigation
          onPrevious={navigateToPreviousChapter}
          onNext={navigateToNextChapter}
        />
      </SafeAreaView>
    </AppWrapper>
  );
});

BibleReader.displayName = 'BibleReader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  verseList: {
    paddingHorizontal: 16,
  },
});
