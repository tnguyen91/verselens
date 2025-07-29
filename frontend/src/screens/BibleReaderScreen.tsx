import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

import rawBibleData from "../../assets/BibleTranslations/ESV/ESV_bible.json";
import { BibleDataStructure, ModalListItem } from "../types/bible";
import { COLORS } from "../styles";
import { DOUBLE_TAP_THRESHOLD_MS } from "../constants/ui";
import { useDebounce } from "../hooks/useDebounce";
import {
  TopBar,
  BookSelectionModal,
  VerseList,
  NavigationControls,
} from "../components";

const bibleData = rawBibleData as BibleDataStructure;

SplashScreen.preventAutoHideAsync();

export const BibleReaderScreen: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<string>(Object.keys(bibleData)[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [isBookSelectionModalVisible, setIsBookSelectionModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTranslateModeEnabled, setIsTranslateModeEnabled] = useState<boolean>(false);
  const [lastTapTimestamp, setLastTapTimestamp] = useState<number | null>(null);
  const [expandedBookInModal, setExpandedBookInModal] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const flatListRef = useRef<FlatList>(null);

  const bookNames = useMemo(() => Object.keys(bibleData), []);
  const chapterCount = useMemo(() => Object.keys(bibleData[selectedBook]).length, [selectedBook]);
  const currentVerseEntries = useMemo(() => 
    Object.entries(bibleData[selectedBook][selectedChapter.toString()]) as [string, string][],
    [selectedBook, selectedChapter]
  );
  const currentBookIndex = useMemo(() => bookNames.indexOf(selectedBook), [bookNames, selectedBook]);
  const isFirstChapter = useMemo(() => 
    currentBookIndex === 0 && selectedChapter === 1, 
    [currentBookIndex, selectedChapter]
  );
  const isLastChapter = useMemo(() => 
    currentBookIndex === bookNames.length - 1 && selectedChapter === chapterCount, 
    [currentBookIndex, bookNames.length, selectedChapter, chapterCount]
  );
  
  const bookChapterModalData = useMemo(() => {
    const filteredBookNames = bookNames.filter((book) =>
      book.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
    
    const result: ModalListItem[] = [];
    
    filteredBookNames.forEach(bookName => {
      result.push({ type: 'book', bookName });
      
      if (expandedBookInModal === bookName) {
        const chapters = Object.keys(bibleData[bookName]).length;
        for (let i = 1; i <= chapters; i++) {
          result.push({ type: 'chapter', bookName, chapterNumber: i });
        }
      }
    });
    
    return result;
  }, [debouncedSearchQuery, bookNames, expandedBookInModal]);

  useEffect(() => {
    const initializeApplication = async (): Promise<void> => {
      try {
        await Font.loadAsync({
          "times-new-roman": require("../../assets/fonts/times.ttf"),
        });
      } catch (error) {
        console.warn('Font loading error:', error);
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    initializeApplication();
  }, []);

  const onLayoutRootView = useCallback(async (): Promise<void> => {
    if (isAppReady) {
      await SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  const scrollToTop = useCallback((): void => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleBookToggleInModal = useCallback((book: string): void => {
    if (expandedBookInModal === book) {
      setExpandedBookInModal(null);
    } else {
      setExpandedBookInModal(book);
    }
  }, [expandedBookInModal]);

  const handleChapterSelectFromModal = useCallback((book: string, chapter: number): void => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setIsBookSelectionModalVisible(false);
    setExpandedBookInModal(null);
    scrollToTop();
  }, [scrollToTop]);

  const navigateToNextChapter = useCallback((): void => {
    if (selectedChapter < chapterCount) {
      setSelectedChapter((prev) => {
        scrollToTop();
        return prev + 1;
      });
    } else if (currentBookIndex < bookNames.length - 1) {
      setSelectedBook(bookNames[currentBookIndex + 1]);
      setSelectedChapter(1);
      scrollToTop();
    }
  }, [selectedChapter, chapterCount, currentBookIndex, bookNames, scrollToTop]);

  const navigateToPreviousChapter = useCallback((): void => {
    if (selectedChapter > 1) {
      setSelectedChapter((prev) => {
        scrollToTop();
        return prev - 1;
      });
    } else if (currentBookIndex > 0) {
      const previousBook = bookNames[currentBookIndex - 1];
      const lastChapter = Object.keys(bibleData[previousBook]).length;
      setSelectedBook(previousBook);
      setSelectedChapter(lastChapter);
      scrollToTop();
    }
  }, [selectedChapter, currentBookIndex, bookNames, scrollToTop]);

  const toggleTranslateMode = useCallback((): void => {
    setIsTranslateModeEnabled((prev: boolean) => !prev);
  }, []);

  const clearSearchQuery = useCallback((): void => {
    setSearchQuery("");
  }, []);

  const handleTopBarDoubleTap = useCallback((): void => {
    const now = Date.now();
    
    if (lastTapTimestamp && (now - lastTapTimestamp) < DOUBLE_TAP_THRESHOLD_MS) {
      scrollToTop();
    }
    setLastTapTimestamp(now);
  }, [lastTapTimestamp, scrollToTop]);

  if (!isAppReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <TopBar
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          isTranslateModeEnabled={isTranslateModeEnabled}
          onBookChapterPress={() => setIsBookSelectionModalVisible(true)}
          onDoubleTap={handleTopBarDoubleTap}
          onToggleTranslateMode={toggleTranslateMode}
        />

        <BookSelectionModal
          isVisible={isBookSelectionModalVisible}
          onClose={() => setIsBookSelectionModalVisible(false)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={clearSearchQuery}
          modalData={bookChapterModalData}
          expandedBook={expandedBookInModal}
          onBookToggle={handleBookToggleInModal}
          onChapterSelect={handleChapterSelectFromModal}
        />

        <VerseList
          ref={flatListRef}
          verses={currentVerseEntries}
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
        />

        <NavigationControls
          isFirstChapter={isFirstChapter}
          isLastChapter={isLastChapter}
          onPrevious={navigateToPreviousChapter}
          onNext={navigateToNextChapter}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
});
