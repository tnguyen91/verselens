import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

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
  const [uiVisible, setUiVisible] = useState(true);

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
    return null; // app is loading
  }

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1); // reset chapter
    setBookModalVisible(false);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setChapterModalVisible(false);
  };

  const goToNext = () => {
    const currentBookIndex = bookNames.indexOf(selectedBook);
    const chapterCount = Object.keys(bibleData[selectedBook]).length;

    if (selectedChapter < chapterCount) {
      setSelectedChapter(selectedChapter + 1);
    } else if (currentBookIndex < bookNames.length - 1) {
      const nextBook = bookNames[currentBookIndex + 1];
      setSelectedBook(nextBook);
      setSelectedChapter(1);
    }
  };

  const goToPrevious = () => {
    const currentBookIndex = bookNames.indexOf(selectedBook);

    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (currentBookIndex > 0) {
      const previousBook = bookNames[currentBookIndex - 1];
      const lastChapterOfPreviousBook = Object.keys(
        bibleData[previousBook]
      ).length;

      setSelectedBook(previousBook);
      setSelectedChapter(lastChapterOfPreviousBook);
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
    <SafeAreaView style={styles.safeAreaView} onLayout={onLayoutRootView}>
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
      <Modal visible={bookModalVisible} animationType="slide">
        <SafeAreaView style={styles.safeAreaView}>
          <FlatList
            data={bookNames}
            keyExtractor={(item) => item}
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
          />
        </SafeAreaView>
      </Modal>

      {/* Chapter Modal */}
      <Modal visible={chapterModalVisible} animationType="slide">
        <SafeAreaView style={styles.safeAreaView} onLayout={onLayoutRootView}>
          <FlatList
            data={chapterList}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookItem}
                onPress={() => handleChapterSelect(item)}
              >
                <Text style={styles.bookText}>Chapter {item}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Verses List */}
      <View style={styles.verseContainer}>
        <FlatList
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: 'black',
  },
  topBar: {
    backgroundColor: '#000',
    padding: 5,
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
    marginRight: 10,
    marginLeft: 1,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  bookItem: {
    backgroundColor: '#000',
    padding: 20,
  },
  bookText: {
    color: 'white',
    fontSize: 17,
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
    marginBottom: 30,
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
});