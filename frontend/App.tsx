import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableHighlight,
  FlatList,
  StyleSheet,
  StatusBar,
} from "react-native";
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

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [selectedBook, setSelectedBook] = useState(Object.keys(bibleData)[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const flatListRef = useRef<FlatList>(null);
  const bookNames = useMemo(() => Object.keys(bibleData), []);
  const chapterCount = Object.keys(bibleData[selectedBook]).length;
  const chapterList = useMemo(() => Array.from({ length: chapterCount }, (_, i) => i + 1), [selectedBook]);
  const currentBookIndex = bookNames.indexOf(selectedBook);
  const isFirstChapter = currentBookIndex === 0 && selectedChapter === 1;
  const isLastChapter = currentBookIndex === bookNames.length - 1 && selectedChapter === chapterCount;
  const filteredBooks = useMemo(
    () =>
      bookNames.filter((book) =>
        book.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, bookNames]
  );

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

  if (!appIsReady) {
    return null;
  }

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setBookModalVisible(false);
    scrollToTop();
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setChapterModalVisible(false);
    scrollToTop();
  };

  const goToNext = () => {
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
  };

  const goToPrevious = () => {
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
  };

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <View style={styles.topBar}>
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
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              multiline={false}
            />
            <TouchableHighlight
              onPress={() => setBookModalVisible(false)}
              underlayColor="#333"
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableHighlight>
          </View>
          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableHighlight
                onPress={() => handleBookSelect(item)}
                underlayColor="#222"
                style={styles.bookItem}
              >
                <Text style={styles.bookItemText}>{item}</Text>
              </TouchableHighlight>
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
            <TouchableHighlight
              onPress={() => setChapterModalVisible(false)}
              underlayColor="#333"
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableHighlight>
          </View>
          <FlatList
            data={chapterList}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableHighlight
                onPress={() => handleChapterSelect(item)}
                underlayColor="#222"
                style={styles.chapterItem}
              >
                <Text style={styles.chapterItemText}>Ch. {item}</Text>
              </TouchableHighlight>
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
          data={Object.entries(bibleData[selectedBook][selectedChapter.toString()])}
          keyExtractor={([verseNumber]) => verseNumber}
          renderItem={({ item: [verseNumber, verseText] }) => (
            <Text style={styles.verse}>
              <Text style={styles.verseLabel}>{verseNumber}. </Text>
              {verseText}
            </Text>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
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
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
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
  },
  chapterButton: {
    backgroundColor: "#696969",
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
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
  verse: {
    fontFamily: "times-new-roman",
    color: "white",
    fontSize: 22,
    marginBottom: 12,
    lineHeight: 30,
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
    paddingBottom: 25,
  },
  navButtonPlaceholder: {
    width: 50,
    height: 50,
  },
  navButton: {
    width: 50,
    height: 50,
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
    paddingHorizontal: 20,
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
    fontSize: 22,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 5,
    borderRadius: 20,
  },
  searchInput: {
    height: 40,
    flex: 1,
    backgroundColor: "#222",
    color: "white",
    paddingHorizontal: 12,
    fontSize: 16,
    borderRadius: 8,
    marginRight: 10,
  },
});