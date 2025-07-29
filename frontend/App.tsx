import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  TextInput,
  TouchableHighlight,
  Pressable,
  FlatList,
  StyleSheet,
  StatusBar,
  ListRenderItem,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Modal from "react-native-modal";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

import rawBibleData from "./assets/BibleTranslations/ESV/ESV_bible.json";

interface BibleDataStructure {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
}

interface BookModalListItem {
  type: 'book';
  bookName: string;
}

interface ChapterModalListItem {
  type: 'chapter';
  bookName: string;
  chapterNumber: number;
}

const bibleData = rawBibleData as BibleDataStructure;

SplashScreen.preventAutoHideAsync();

const NAVIGATION_BUTTON_SIZE = 50;
const NAVIGATION_BOTTOM_PADDING = 25;
const NAVIGATION_TOTAL_HEIGHT = NAVIGATION_BUTTON_SIZE + NAVIGATION_BOTTOM_PADDING;

const FLATLIST_PERFORMANCE_CONFIG = {
  VERSES: {
    ITEM_HEIGHT: 54,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 45,
    INITIAL_NUM_TO_RENDER: 12,
    UPDATE_CELLS_BATCHING_PERIOD: 200,
  },
  BOOKS_AND_CHAPTERS: {
    ITEM_HEIGHT: 60,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 50,
    INITIAL_NUM_TO_RENDER: 10,
  },
} as const;

const DOUBLE_TAP_THRESHOLD_MS = 300;

interface BookListItemProps {
  item: string;
  onPress: (bookName: string) => void;
}

const BookListItem = memo<BookListItemProps>(({ item, onPress }) => (
  <TouchableHighlight
    onPress={() => onPress(item)}
    underlayColor="#222"
    style={styles.bookItem}
  >
    <Text style={styles.bookItemText}>{item}</Text>
  </TouchableHighlight>
));
BookListItem.displayName = 'BookListItem';

interface VerseDisplayItemProps {
  verseNumber: string;
  verseText: string;
}

const VerseDisplayItem = memo<VerseDisplayItemProps>(({ verseNumber, verseText }) => (
  <View style={styles.verseItemContainer}>
    <Text style={styles.verse}>
      <Text style={styles.verseLabel}>{verseNumber}. </Text>
      {verseText}
    </Text>
  </View>
), (prevProps, nextProps) => {
  return prevProps.verseNumber === nextProps.verseNumber && 
         prevProps.verseText === nextProps.verseText;
});
VerseDisplayItem.displayName = 'VerseDisplayItem';

export default function App(): React.ReactElement | null {
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<string>(Object.keys(bibleData)[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [isBookSelectionModalVisible, setIsBookSelectionModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [isTranslateModeEnabled, setIsTranslateModeEnabled] = useState<boolean>(false);
  const [lastTapTimestamp, setLastTapTimestamp] = useState<number | null>(null);
  const [expandedBookInModal, setExpandedBookInModal] = useState<string | null>(null);

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
    
    const result: (BookModalListItem | ChapterModalListItem)[] = [];
    
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
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const initializeApplication = async (): Promise<void> => {
      try {
        await Font.loadAsync({
          "times-new-roman": require("./assets/fonts/times.ttf"),
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

  const renderVerseItem: ListRenderItem<[string, string]> = useCallback(({ item: [verseNumber, verseText] }) => (
    <VerseDisplayItem verseNumber={verseNumber} verseText={verseText} />
  ), []);

  const renderBookChapterModalItem: ListRenderItem<BookModalListItem | ChapterModalListItem> = useCallback(({ item }) => {
    if (item.type === 'book') {
      return (
        <TouchableHighlight
          onPress={() => handleBookToggleInModal(item.bookName)}
          underlayColor="#222"
          style={[styles.bookItem, expandedBookInModal === item.bookName && styles.expandedBookItem]}
        >
          <View style={styles.bookItemContent}>
            <Text style={styles.bookItemText}>{item.bookName}</Text>
            <Text style={styles.expandIcon}>
              {expandedBookInModal === item.bookName ? '▼' : '▶'}
            </Text>
          </View>
        </TouchableHighlight>
      );
    } else {
      return (
        <TouchableHighlight
          onPress={() => handleChapterSelectFromModal(item.bookName, item.chapterNumber)}
          underlayColor="#333"
          style={styles.chapterItemInBook}
        >
          <Text style={styles.chapterItemInBookText}>Chapter {item.chapterNumber}</Text>
        </TouchableHighlight>
      );
    }
  }, [handleBookToggleInModal, handleChapterSelectFromModal, expandedBookInModal]);

  const renderBookItem: ListRenderItem<string> = useCallback(({ item }) => (
    <BookListItem item={item} onPress={handleBookToggleInModal} />
  ), [handleBookToggleInModal]);

  const getVerseItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_PERFORMANCE_CONFIG.VERSES.ITEM_HEIGHT,
    offset: FLATLIST_PERFORMANCE_CONFIG.VERSES.ITEM_HEIGHT * index,
    index,
  }), []);

  const getBookChapterItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.ITEM_HEIGHT,
    offset: FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.ITEM_HEIGHT * index,
    index,
  }), []);

  const getBookItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.ITEM_HEIGHT,
    offset: FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.ITEM_HEIGHT * index,
    index,
  }), []);

  if (!isAppReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Pressable onPress={handleTopBarDoubleTap} style={styles.topBar}>
        <View style={styles.bookChapterContainer}>
          <TouchableHighlight
            onPress={() => setIsBookSelectionModalVisible(true)}
            underlayColor="#555"
            style={styles.singleBookButton}
          >
            <Text style={styles.buttonText}>{selectedBook} {selectedChapter}</Text>
          </TouchableHighlight>
        </View>

        <Pressable
          onPress={toggleTranslateMode}
          style={styles.modeToggleButton}
        >
          <Icon 
            style={styles.translateIcon}
            name={isTranslateModeEnabled ? "translate" : "translate-off"}
          />
        </Pressable>
      </Pressable>

      {/* Book Selection Modal */}
      <Modal
        isVisible={isBookSelectionModalVisible}
        onSwipeComplete={() => setIsBookSelectionModalVisible(false)}
        swipeDirection="down"
        style={styles.bookSelectionModal}
        propagateSwipe
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search books..."
                placeholderTextColor="#aaa"
                value={searchQuery}
                onChangeText={setSearchQuery}
                multiline={false}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={clearSearchQuery}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => setIsBookSelectionModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          <FlatList
            data={bookChapterModalData}
            keyExtractor={(item) => item.type === 'book' ? item.bookName : `${item.bookName}-${item.chapterNumber}`}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.MAX_TO_RENDER_PER_BATCH}
            windowSize={FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.WINDOW_SIZE}
            initialNumToRender={FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.INITIAL_NUM_TO_RENDER}
            getItemLayout={getBookChapterItemLayout}
            renderItem={renderBookChapterModalItem}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        </View>
      </Modal>

      {/* Verse List */}
      <View style={styles.verseContainer}>
        <FlatList
          ref={flatListRef}
          ListHeaderComponent={<View style={{ height: 10 }} />}
          data={currentVerseEntries}
          keyExtractor={([verseNumber]) => `${selectedBook}-${selectedChapter}-${verseNumber}`}
          removeClippedSubviews={true}
          maxToRenderPerBatch={FLATLIST_PERFORMANCE_CONFIG.VERSES.MAX_TO_RENDER_PER_BATCH}
          windowSize={FLATLIST_PERFORMANCE_CONFIG.VERSES.WINDOW_SIZE}
          initialNumToRender={FLATLIST_PERFORMANCE_CONFIG.VERSES.INITIAL_NUM_TO_RENDER}
          updateCellsBatchingPeriod={FLATLIST_PERFORMANCE_CONFIG.VERSES.UPDATE_CELLS_BATCHING_PERIOD}
          getItemLayout={getVerseItemLayout}
          renderItem={renderVerseItem}
          ListFooterComponent={<View style={{ height: NAVIGATION_TOTAL_HEIGHT }} />}
        />
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtonsContainer}>
        {isFirstChapter ? (
          <View style={styles.navigationButtonPlaceholder} />
        ) : (
          <TouchableHighlight
            onPress={navigateToPreviousChapter}
            style={styles.navigationButton}
            underlayColor="#555"
          >
            <Text style={styles.navigationButtonText}>←</Text>
          </TouchableHighlight>
        )}
        {isLastChapter ? (
          <View style={styles.navigationButtonPlaceholder} />
        ) : (
          <TouchableHighlight
            onPress={navigateToNextChapter}
            style={styles.navigationButton}
            underlayColor="#555"
          >
            <Text style={styles.navigationButtonText}>→</Text>
          </TouchableHighlight>
        )}
      </View>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  topBar: {
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  bookChapterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  bookButton: {
    backgroundColor: "#696969",
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    marginRight: 1,
  },
  singleBookButton: {
    backgroundColor: "#696969",
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  chapterButton: {
    backgroundColor: "#696969",
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginLeft: 1,
  },
  bookItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bookItemText: {
    color: "white",
    fontSize: 17,
  },
  expandedBookItem: {
    backgroundColor: "#333",
  },
  bookItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandIcon: {
    color: "#aaa",
    fontSize: 12,
  },
  chapterItemInBook: {
    paddingVertical: 12,
    paddingHorizontal: 35,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  chapterItemInBookText: {
    color: "#ccc",
    fontSize: 15,
  },
  verseContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  verseItemContainer: {
    marginBottom: 2,
  },
  verse: {
    fontFamily: "times-new-roman",
    color: "white",
    fontSize: 22,
    marginBottom: 12,
    lineHeight: 30,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  verseLabel: {
    fontWeight: "bold",
    color: "#ccc",
    fontSize: 13,
  },
  navigationButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: NAVIGATION_BOTTOM_PADDING,
  },
  navigationButtonPlaceholder: {
    width: NAVIGATION_BUTTON_SIZE,
    height: NAVIGATION_BUTTON_SIZE,
  },
  navigationButton: {
    width: NAVIGATION_BUTTON_SIZE,
    height: NAVIGATION_BUTTON_SIZE,
    backgroundColor: "#696969",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationButtonText: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
  },
  bookSelectionModal: {
    justifyContent: "flex-start",
    backgroundColor: "black",
    margin: 0,
    marginTop: 50,
  },
  modalContent: {
    backgroundColor: "#000",
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  modalTitle: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalClose: {
    color: "white",
    fontSize: 15,
  },
  modalCloseButton: {
    padding: 5,
    borderRadius: 20,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    height: 40,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#222",
    color: "white",
    paddingHorizontal: 12,
    fontSize: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  clearButton: {
    position: "absolute",
    right: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  clearButtonText: {
    color: "#aaa",
    fontSize: 18,
  },
  modeToggleButton: {
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  translateIcon: {
    fontSize: 27,
    color: 'white',
  },
});