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
  Keyboard,
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
    Keyboard.dismiss();
    if (expandedBookInModal === book) {
      setExpandedBookInModal(null);
    } else {
      setExpandedBookInModal(book);
    }
  }, [expandedBookInModal]);

  const handleChapterSelectFromModal = useCallback((book: string, chapter: number): void => {
    Keyboard.dismiss();
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
            onScroll={() => Keyboard.dismiss()}
            scrollEventThrottle={16}
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

// Design System Constants
const COLORS = {
  // Base colors
  primary: '#000000',
  secondary: '#1a1a1a',
  tertiary: '#2a2a2a',
  
  // Accent colors
  accent: '#4a5568',
  accentLight: '#6b7280',
  accentDark: '#374151',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  
  // Border colors
  border: 'rgba(255, 255, 255, 0.15)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderHeavy: 'rgba(255, 255, 255, 0.3)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.6)',
} as const;

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 25,
} as const;

const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 22,
    xxxl: 24,
    huge: 28,
  },
  weights: {
    normal: 'normal' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: 'bold' as const,
  },
} as const;

const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  
  // Top Bar Styles
  topBar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  
  bookChapterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Button Styles
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: "center",
  },
  
  bookButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    marginRight: 1,
    ...SHADOWS.sm,
  },
  
  singleBookButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  
  chapterButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    marginLeft: 1,
    ...SHADOWS.sm,
  },
  
  // Book Selection Modal Styles
  bookItem: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  
  bookItemText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  expandedBookItem: {
    backgroundColor: COLORS.tertiary,
  },
  
  bookItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  expandIcon: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  
  chapterItemInBook: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl + SPACING.sm,
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginLeft: SPACING.sm,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accentLight,
  },
  
  chapterItemInBookText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  // Verse Display Styles
  verseContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  
  verseItemContainer: {
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  
  verse: {
    fontFamily: "times-new-roman",
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.xxl,
    marginBottom: SPACING.md,
    lineHeight: 32,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  
  verseLabel: {
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  
  // Navigation Styles
  navigationButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingBottom: NAVIGATION_BOTTOM_PADDING,
  },
  
  navigationButtonPlaceholder: {
    width: NAVIGATION_BUTTON_SIZE,
    height: NAVIGATION_BUTTON_SIZE,
  },
  
  navigationButton: {
    width: NAVIGATION_BUTTON_SIZE,
    height: NAVIGATION_BUTTON_SIZE,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
  },
  
  navigationButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  
  // Modal Styles
  bookSelectionModal: {
    justifyContent: "flex-start",
    backgroundColor: COLORS.overlay,
    margin: 0,
    marginTop: 50,
  },
  
  modalContent: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
    overflow: 'hidden',
  },
  
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  modalTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  
  modalClose: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  modalCloseButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accentDark,
  },
  
  // Search Styles
  searchContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    height: 40,
  },
  
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.tertiary,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  
  clearButton: {
    position: "absolute",
    right: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
  },
  
  clearButtonText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  
  // Translation Mode Toggle
  modeToggleButton: {
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
    backgroundColor: COLORS.accentDark,
    ...SHADOWS.sm,
  },
  
  translateIcon: {
    fontSize: TYPOGRAPHY.sizes.huge,
    color: COLORS.textPrimary,
  },
});