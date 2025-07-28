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
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Modal from "react-native-modal";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

import rawBibleData from "./assets/BibleTranslations/ESV/ESV_bible.json";
const bibleData = rawBibleData as {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
};

SplashScreen.preventAutoHideAsync();

// Navigation button dimensions for consistent spacing
const NAVIGATION_BUTTON_HEIGHT = 50;
const NAVIGATION_BOTTOM_PADDING = 25;
const NAVIGATION_TOTAL_HEIGHT = NAVIGATION_BUTTON_HEIGHT + NAVIGATION_BOTTOM_PADDING;

const BookItem = memo(({ item, onPress }: { item: string; onPress: (item: string) => void }) => (
  <TouchableHighlight
    onPress={() => onPress(item)}
    underlayColor="#222"
    style={styles.bookItem}
  >
    <Text style={styles.bookItemText}>{item}</Text>
  </TouchableHighlight>
));

const ChapterItem = memo(({ item, onPress }: { item: number; onPress: (item: number) => void }) => (
  <TouchableHighlight
    onPress={() => onPress(item)}
    underlayColor="#222"
    style={styles.chapterItem}
  >
    <Text style={styles.chapterItemText}>Ch. {item}</Text>
  </TouchableHighlight>
));

const VerseItem = memo(({ verseNumber, verseText }: { verseNumber: string; verseText: string }) => (
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

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [selectedBook, setSelectedBook] = useState(Object.keys(bibleData)[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [translateMode, setTranslateMode] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const bookNames = useMemo(() => Object.keys(bibleData), []);
  const chapterCount = Object.keys(bibleData[selectedBook]).length;
  const chapterList = useMemo(() => Array.from({ length: chapterCount }, (_, i) => i + 1), [selectedBook]);
  const verseData = useMemo(() => 
    Object.entries(bibleData[selectedBook][selectedChapter.toString()]),
    [selectedBook, selectedChapter]
  );
  const currentBookIndex = bookNames.indexOf(selectedBook);
  const isFirstChapter = currentBookIndex === 0 && selectedChapter === 1;
  const isLastChapter = currentBookIndex === bookNames.length - 1 && selectedChapter === chapterCount;
  const filteredBooks = useMemo(
    () =>
      bookNames.filter((book) =>
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
    async function prepare() {
      try {
        await Font.loadAsync({
          "times-new-roman": require("./assets/fonts/times.ttf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleBookSelect = useCallback((book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setBookModalVisible(false);
    scrollToTop();
  }, [scrollToTop]);

  const handleChapterSelect = useCallback((chapter: number) => {
    setSelectedChapter(chapter);
    setChapterModalVisible(false);
    scrollToTop();
  }, [scrollToTop]);

  const goToNext = useCallback(() => {
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

  const goToPrevious = useCallback(() => {
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

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const toggleTranslateMode = useCallback(() => {
    setTranslateMode(prev => !prev);
  }, []);

  const handleTopBarDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      scrollToTop();
    }
    setLastTap(now);
  }, [lastTap, scrollToTop]);

  const renderVerseItem = useCallback(({ item: [verseNumber, verseText] }: { item: [string, string] }) => (
    <VerseItem verseNumber={verseNumber} verseText={verseText} />
  ), []);

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
            data={filteredBooks}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            getItemLayout={(data, index) => ({
              length: 60,
              offset: 60 * index,
              index,
            })}
            renderItem={({ item }) => (
              <BookItem item={item} onPress={handleBookSelect} />
            )}
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
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
            getItemLayout={(data, index) => ({
              length: 60,
              offset: 60 * index,
              index,
            })}
            renderItem={({ item }) => (
              <ChapterItem item={item} onPress={handleChapterSelect} />
            )}
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
          maxToRenderPerBatch={10}
          windowSize={8}
          initialNumToRender={12}
          updateCellsBatchingPeriod={200}
          getItemLayout={(data, index) => ({
            length: 54,
            offset: 54 * index,
            index,
          })}
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
  bookItemActive: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#333",
  },
  chapterItemActive: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#333",
  },
});