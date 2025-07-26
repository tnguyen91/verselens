import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  FlatList,
  StyleSheet,
} from 'react-native';

import Modal from 'react-native-modal';

type BibleData = {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
};
import rawBibleData from './assets/BibleTranslations/ESV/ESV_bible.json';
const bibleData = rawBibleData as BibleData;

import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  const bookNames = Object.keys(bibleData);
  const [selectedBook, setSelectedBook] = useState(bookNames[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredBooks = bookNames.filter((book) =>
    book.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'times-new-roman': require('./assets/fonts/times.ttf'),
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

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const goToNext = () => {
    const currentBookIndex = bookNames.indexOf(selectedBook);
    const chapterCount = Object.keys(bibleData[selectedBook]).length;

    if (selectedChapter < chapterCount) {
      setSelectedChapter((prev) => {
        scrollToTop();
        return prev + 1;
      });
    } else if (currentBookIndex < bookNames.length - 1) {
      const nextBook = bookNames[currentBookIndex + 1];
      setSelectedBook(nextBook);
      setSelectedChapter(1);
      scrollToTop();
    }
  };

  const goToPrevious = () => {
    const currentBookIndex = bookNames.indexOf(selectedBook);

    if (selectedChapter > 1) {
      setSelectedChapter((prev) => {
        scrollToTop();
        return prev - 1;
      });
    } else if (currentBookIndex > 0) {
      const previousBook = bookNames[currentBookIndex - 1];
      const lastChapterOfPreviousBook = Object.keys(
        bibleData[previousBook]
      ).length;

      setSelectedBook(previousBook);
      setSelectedChapter(lastChapterOfPreviousBook);
      scrollToTop();
    }
  };

  const chapterCount = Object.keys(bibleData[selectedBook]).length;
  const chapterList = Array.from({ length: chapterCount }, (_, i) => i + 1);
  const currentBookIndex = bookNames.indexOf(selectedBook);
  const isFirstChapter =
    currentBookIndex === 0 && selectedChapter === 1;
  const isLastChapter =
    currentBookIndex === bookNames.length - 1 &&
    selectedChapter ===
      Object.keys(bibleData[selectedBook]).length;

  return (
    <View style={styles.view}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setBookModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.bookButton}>{selectedBook}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setChapterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.chapterButton}>{selectedChapter}</Text>
        </TouchableOpacity>
      </View>

      {/* Book Modal */}
      <Modal 
        isVisible={bookModalVisible} 
        onSwipeComplete={() => setBookModalVisible(false)}
        swipeDirection='down'
        style={styles.bookModal}
        propagateSwipe={true}
      > 
        <View style={styles.modalContent}>
          <View style={styles.modalHandle}>
            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              multiline={false}
            />
            <TouchableOpacity onPress={() => setBookModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookItem}
                onPress={() => handleBookSelect(item)}
                activeOpacity={0.7}
                accessibilityLabel={`Select book ${item}`}
              >
                <Text style={styles.bookText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={<View style={{ height: 100}} />}
          />
        </View>
      </Modal>

      {/* Chapter Modal */}
      <Modal 
        isVisible={chapterModalVisible} 
        onSwipeComplete={() => setChapterModalVisible(false)}
        swipeDirection='down'
        style={styles.chapterModal}
        propagateSwipe={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle}>
            <Text style={styles.modalTitle}>Chapters</Text>
            <TouchableOpacity onPress={() => setChapterModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={chapterList}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chapterItem}
                onPress={() => handleChapterSelect(item)}
              >
                <Text style={styles.chapterText}>Ch. {item}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={<View style={{ height: 100}} />}
          />
        </View>
      </Modal>

      {/* Verses List */}
      <View style={styles.verseContainer}>
        <FlatList
          ListHeaderComponent={<View style={{ height: 10}} />}
          ref={flatListRef}
          data={Object.entries(
            bibleData[selectedBook][selectedChapter.toString()]
          )}
          keyExtractor={([verseNumber]) => verseNumber}
          renderItem={({ item: [verseNumber, verseText] }) => (
            <Text style={styles.verseText}>
              <Text style={styles.verseNumber}>{verseNumber}. </Text>
              {verseText}
            </Text>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>

      <View style={styles.navButtonsContainer}>
        {isFirstChapter ? (
          <View style={styles.navButtonPlaceholder} />
        ) : (
          <TouchableHighlight
            onPress={goToPrevious}
            style={styles.navButton}
            underlayColor='#8f8f8fff'
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
            underlayColor='#8f8f8fff'
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableHighlight>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    backgroundColor: 'black',
  },
  topBar: {
    backgroundColor: '#000',
    padding: 7,
    flexDirection: 'row', 
    alignItems: 'center',
    borderBottomWidth: 0.2,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  bookButton: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    backgroundColor: '#696969',
    paddingVertical: 7,
    paddingHorizontal: 15,
    marginTop: 40,
    marginRight: 1,
    marginLeft: 10,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  chapterButton: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    backgroundColor: '#696969',
    paddingVertical: 7,
    paddingHorizontal: 15,
    marginTop: 40,
    marginRight: 10,
    marginLeft: 1,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  bookItem: {
    padding: 20,
  },
  bookText: {
    color: 'white',
    fontSize: 17,
  },
  chapterItem: {
    padding: 20,
  },
  chapterText: {
    color: 'white',
    fontSize: 20,
  },
  verseContainer: {
    flex: 1,
    paddingHorizontal: 7,
  },
  verseText: {
    fontFamily: 'times-new-roman',
    color: 'white',
    fontSize: 23,
    marginBottom: 10,
    lineHeight: 30,
  },
  verseNumber: {
    fontWeight: 'bold',
    color: '#ccc',
    fontSize: 13,
  },
  navButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  navButtonPlaceholder: {
    width: 50,
    height: 50,
  },
  navButton: {
    position: 'static',
    width: 50,
    height: 50,
    backgroundColor: '#696969',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },

  bookModal: {
    justifyContent: 'flex-start',
    backgroundColor: 'black',
    margin: 0,
    marginTop: 50,
  },
  chapterModal: {
    justifyContent: 'flex-start',
    backgroundColor: 'black',
    margin: 0,
    marginTop: 50,
  },
  modalHandle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalClose: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: '#000',
    borderRadius: 20,
  },

  searchInput: {
    height: 40,  
    width: '90%', 
    backgroundColor: '#222',
    color: 'white',
    paddingHorizontal: 12,
    fontSize: 16, 
    borderRadius: 8,
  },
});