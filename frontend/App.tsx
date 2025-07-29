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

interface BibleData {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
}

interface VerseData {
  verseNumber: string;
  verseText: string;
}

interface BookListItem {
  type: 'book';
  bookName: string;
}

interface ChapterListItem {
  type: 'chapter';
  bookName: string;
  chapterNumber: number;
}

const bibleData = rawBibleData as BibleData;

SplashScreen.preventAutoHideAsync();

const NAVIGATION_BUTTON_HEIGHT = 50;
const NAVIGATION_BOTTOM_PADDING = 25;
const NAVIGATION_TOTAL_HEIGHT = NAVIGATION_BUTTON_HEIGHT + NAVIGATION_BOTTOM_PADDING;

const FLATLIST_CONFIG = {
  VERSE: {
    ITEM_HEIGHT: 54,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 45,
    INITIAL_NUM_TO_RENDER: 12,
    UPDATE_CELLS_BATCHING_PERIOD: 200,
  },
  BOOK: {
    ITEM_HEIGHT: 60,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 50,
    INITIAL_NUM_TO_RENDER: 10,
  },
  CHAPTER: {
    ITEM_HEIGHT: 60,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 10,
    INITIAL_NUM_TO_RENDER: 15,
  },
} as const;

const DOUBLE_PRESS_DELAY = 300;

interface BookItemProps {
  item: string;
  onPress: (item: string) => void;
}

const BookItem = memo<BookItemProps>(({ item, onPress }) => (
  <TouchableHighlight
    onPress={() => onPress(item)}
    underlayColor="#222"
    style={styles.bookItem}
  >
    <Text style={styles.bookItemText}>{item}</Text>
  </TouchableHighlight>
));
BookItem.displayName = 'BookItem';

interface ChapterItemProps {
  item: number;
  onPress: (item: number) => void;
}

const ChapterItem = memo<ChapterItemProps>(({ item, onPress }) => (
  <TouchableHighlight
    onPress={() => onPress(item)}
    underlayColor="#222"
    style={styles.chapterItem}
  >
    <Text style={styles.chapterItemText}>Ch. {item}</Text>
  </TouchableHighlight>
));
ChapterItem.displayName = 'ChapterItem';

interface VerseItemProps {
  verseNumber: string;
  verseText: string;
}

const VerseItem = memo<VerseItemProps>(({ verseNumber, verseText }) => (
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
VerseItem.displayName = 'VerseItem';

export default function App(): React.ReactElement | null {
  const [appIsReady, setAppIsReady] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<string>(Object.keys(bibleData)[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [bookModalVisible, setBookModalVisible] = useState<boolean>(false);
  const [chapterModalVisible, setChapterModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [translateMode, setTranslateMode] = useState<boolean>(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const bookNames = useMemo(() => Object.keys(bibleData), []);
  const chapterCount = useMemo(() => Object.keys(bibleData[selectedBook]).length, [selectedBook]);
  const chapterList = useMemo(() => 
    Array.from({ length: chapterCount }, (_, i) => i + 1), 
    [chapterCount]
  );
  const verseData = useMemo(() => 
    Object.entries(bibleData[selectedBook][selectedChapter.toString()]),
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
  
  const bookChapterData = useMemo(() => {
    const filteredBookNames = bookNames.filter((book) =>
      book.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
    
    const result: (BookListItem | ChapterListItem)[] = [];
    
    filteredBookNames.forEach(bookName => {
      result.push({ type: 'book', bookName });
      
      if (expandedBook === bookName) {
        const chapters = Object.keys(bibleData[bookName]).length;
        for (let i = 1; i <= chapters; i++) {
          result.push({ type: 'chapter', bookName, chapterNumber: i });
        }
      }
    });
    
    return result;
  }, [debouncedSearchQuery, bookNames, expandedBook]);

  const filteredBooks = useMemo(
    () => bookNames.filter((book) =>
      book.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ),
    [debouncedSearchQuery, bookNames]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        await Font.loadAsync({
          "times-new-roman": require("./assets/fonts/times.ttf"),
        });
      } catch (error) {
        console.warn('Font loading error:', error);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  const onLayoutRootView = useCallback(async (): Promise<void> => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const scrollToTop = useCallback((): void => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleBookSelect = useCallback((book: string): void => {
    if (expandedBook === book) {
      setExpandedBook(null);
    } else {
      setExpandedBook(book);
    }
  }, [expandedBook]);

  const handleChapterSelectFromBook = useCallback((book: string, chapter: number): void => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setBookModalVisible(false);
    setExpandedBook(null);
    scrollToTop();
  }, [scrollToTop]);

  const handleChapterSelect = useCallback((chapter: number): void => {
    setSelectedChapter(chapter);
    setChapterModalVisible(false);
    scrollToTop();
  }, [scrollToTop]);

  const goToNext = useCallback((): void => {
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

  const goToPrevious = useCallback((): void => {
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

  const clearSearch = useCallback((): void => {
    setSearchQuery("");
  }, []);

  const toggleTranslateMode = useCallback((): void => {
    setTranslateMode(prev => !prev);
  }, []);

  const handleTopBarDoubleTap = useCallback((): void => {
    const now = Date.now();
    
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      scrollToTop();
    }
    setLastTap(now);
  }, [lastTap, scrollToTop]);

  const renderVerseItem: ListRenderItem<[string, string]> = useCallback(({ item: [verseNumber, verseText] }) => (
    <VerseItem verseNumber={verseNumber} verseText={verseText} />
  ), []);

  const renderBookChapterItem: ListRenderItem<BookListItem | ChapterListItem> = useCallback(({ item }) => {
    if (item.type === 'book') {
      return (
        <TouchableHighlight
          onPress={() => handleBookSelect(item.bookName)}
          underlayColor="#222"
          style={[styles.bookItem, expandedBook === item.bookName && styles.expandedBookItem]}
        >
          <View style={styles.bookItemContent}>
            <Text style={styles.bookItemText}>{item.bookName}</Text>
            <Text style={styles.expandIcon}>
              {expandedBook === item.bookName ? '▼' : '▶'}
            </Text>
          </View>
        </TouchableHighlight>
      );
    } else {
      return (
        <TouchableHighlight
          onPress={() => handleChapterSelectFromBook(item.bookName, item.chapterNumber)}
          underlayColor="#333"
          style={styles.chapterItemInBook}
        >
          <Text style={styles.chapterItemInBookText}>Chapter {item.chapterNumber}</Text>
        </TouchableHighlight>
      );
    }
  }, [handleBookSelect, handleChapterSelectFromBook, expandedBook]);

  const renderBookItem: ListRenderItem<string> = useCallback(({ item }) => (
    <BookItem item={item} onPress={handleBookSelect} />
  ), [handleBookSelect]);

  const renderChapterItem: ListRenderItem<number> = useCallback(({ item }) => (
    <ChapterItem item={item} onPress={handleChapterSelect} />
  ), [handleChapterSelect]);

  const getVerseItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_CONFIG.VERSE.ITEM_HEIGHT,
    offset: FLATLIST_CONFIG.VERSE.ITEM_HEIGHT * index,
    index,
  }), []);

  const getBookChapterItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_CONFIG.BOOK.ITEM_HEIGHT,
    offset: FLATLIST_CONFIG.BOOK.ITEM_HEIGHT * index,
    index,
  }), []);

  const getBookItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_CONFIG.BOOK.ITEM_HEIGHT,
    offset: FLATLIST_CONFIG.BOOK.ITEM_HEIGHT * index,
    index,
  }), []);

  const getChapterItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_CONFIG.CHAPTER.ITEM_HEIGHT,
    offset: FLATLIST_CONFIG.CHAPTER.ITEM_HEIGHT * index,
    index,
  }), []);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Pressable onPress={handleTopBarDoubleTap} style={styles.topBar}>
        <View style={styles.bookChapterContainer}>
          <TouchableHighlight
            onPress={() => setBookModalVisible(true)}
            underlayColor="#555"
            style={styles.bookButton}
          >
            <Text style={styles.buttonText}>{selectedBook}</Text>
          </TouchableHighlight>
          <TouchableHighlight
            onPress={() => setChapterModalVisible(true)}
            underlayColor="#555"
            style={styles.chapterButton}
          >
            <Text style={styles.buttonText}>{selectedChapter}</Text>
          </TouchableHighlight>
        </View>

        <Pressable
          onPress={toggleTranslateMode}
          style={styles.modeToggleButton}
        >
          <Icon 
            style={styles.translateIcon}
            name={translateMode ? "translate" : "translate-off"}
          />
        </Pressable>
      </Pressable>

      {/* Book Modal */}
      <Modal
        isVisible={bookModalVisible}
        onSwipeComplete={() => setBookModalVisible(false)}
        swipeDirection="down"
        style={styles.bookModal}
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
                  onPress={clearSearch}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => setBookModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          <FlatList
            data={bookChapterData}
            keyExtractor={(item) => item.type === 'book' ? item.bookName : `${item.bookName}-${item.chapterNumber}`}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={FLATLIST_CONFIG.BOOK.MAX_TO_RENDER_PER_BATCH}
            windowSize={FLATLIST_CONFIG.BOOK.WINDOW_SIZE}
            initialNumToRender={FLATLIST_CONFIG.BOOK.INITIAL_NUM_TO_RENDER}
            getItemLayout={getBookChapterItemLayout}
            renderItem={renderBookChapterItem}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        </View>
      </Modal>

      {/* Chapter Modal */}
      <Modal
        isVisible={chapterModalVisible}
        onSwipeComplete={() => setChapterModalVisible(false)}
        swipeDirection="down"
        style={styles.chapterModal}
        propagateSwipe
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chapters</Text>
            <Pressable
              onPress={() => setChapterModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          <FlatList
            data={chapterList}
            keyExtractor={(item) => item.toString()}
            removeClippedSubviews={true}
            maxToRenderPerBatch={FLATLIST_CONFIG.CHAPTER.MAX_TO_RENDER_PER_BATCH}
            windowSize={FLATLIST_CONFIG.CHAPTER.WINDOW_SIZE}
            initialNumToRender={FLATLIST_CONFIG.CHAPTER.INITIAL_NUM_TO_RENDER}
            getItemLayout={getChapterItemLayout}
            renderItem={renderChapterItem}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        </View>
      </Modal>

      {/* Verse List */}
      <View style={styles.verseContainer}>
        <FlatList
          ref={flatListRef}
          ListHeaderComponent={<View style={{ height: 10 }} />}
          data={verseData}
          keyExtractor={([verseNumber]) => `${selectedBook}-${selectedChapter}-${verseNumber}`}
          removeClippedSubviews={true}
          maxToRenderPerBatch={FLATLIST_CONFIG.VERSE.MAX_TO_RENDER_PER_BATCH}
          windowSize={FLATLIST_CONFIG.VERSE.WINDOW_SIZE}
          initialNumToRender={FLATLIST_CONFIG.VERSE.INITIAL_NUM_TO_RENDER}
          updateCellsBatchingPeriod={FLATLIST_CONFIG.VERSE.UPDATE_CELLS_BATCHING_PERIOD}
          getItemLayout={getVerseItemLayout}
          renderItem={renderVerseItem}
          ListFooterComponent={<View style={{ height: NAVIGATION_TOTAL_HEIGHT }} />}
        />
      </View>

      {/* Navigation */}
      <View style={styles.navButtonsContainer}>
        {isFirstChapter ? (
          <View style={styles.navButtonPlaceholder} />
        ) : (
          <TouchableHighlight
            onPress={goToPrevious}
            style={styles.navButton}
            underlayColor="#555"
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableHighlight>
        )}
        {isLastChapter ? (
          <View style={styles.navButtonPlaceholder} />
        ) : (
          <TouchableHighlight
            onPress={goToNext}
            style={styles.navButton}
            underlayColor="#555"
          >
            <Text style={styles.navButtonText}>→</Text>
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
  chapterItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  chapterItemText: {
    color: "white",
    fontSize: 20,
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
  navButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: NAVIGATION_BOTTOM_PADDING,
  },
  navButtonPlaceholder: {
    width: NAVIGATION_BUTTON_HEIGHT,
    height: NAVIGATION_BUTTON_HEIGHT,
  },
  navButton: {
    width: NAVIGATION_BUTTON_HEIGHT,
    height: NAVIGATION_BUTTON_HEIGHT,
    backgroundColor: "#696969",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
  },
  bookModal: {
    justifyContent: "flex-start",
    backgroundColor: "black",
    margin: 0,
    marginTop: 50,
  },
  chapterModal: {
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