import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import type { FlatList as FlatListType } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import rawBibleData from './assets/BibleTranslations/ESV/ESV_bible.json';
import BookSelectorModal from './components/BookSelectorModal';
import ChapterSelectorModal from './components/ChapterSelectorModal';
import VerseList from './components/VerseList';
import NavigationControls from './components/NavigationControls';
import { styles } from './components/styles';

SplashScreen.preventAutoHideAsync();

const bibleData = rawBibleData as Record<string, Record<string, Record<string, string>>>;

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [selectedBook, setSelectedBook] = useState(Object.keys(bibleData)[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isBookModalVisible, setBookModalVisible] = useState(false);
  const [isChapterModalVisible, setChapterModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const flatListRef = useRef<FlatList<any>>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({ 'times-new-roman': require('./assets/fonts/times.ttf') });
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) await SplashScreen.hideAsync();
  }, [isReady]);

  const bookNames = Object.keys(bibleData);
  const currentBookIndex = bookNames.indexOf(selectedBook);
  const chapterCount = Object.keys(bibleData[selectedBook]).length;
  const chapterList = Array.from({ length: chapterCount }, (_, i) => i + 1);

  const filteredBookNames = useMemo(() =>
    bookNames.filter((name) => name.toLowerCase().includes(searchText.toLowerCase())),
    [searchText, bookNames]
  );

  const isFirstChapter = currentBookIndex === 0 && selectedChapter === 1;
  const isLastChapter =
    currentBookIndex === bookNames.length - 1 && selectedChapter === chapterCount;

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onSelectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setBookModalVisible(false);
    scrollToTop();
  };

  const onSelectChapter = (chapter: number) => {
    setSelectedChapter(chapter);
    setChapterModalVisible(false);
    scrollToTop();
  };

  const goToPrevious = () => {
    if (selectedChapter > 1) {
      setSelectedChapter((prev) => prev - 1);
    } else if (currentBookIndex > 0) {
      const prevBook = bookNames[currentBookIndex - 1];
      const lastChapter = Object.keys(bibleData[prevBook]).length;
      setSelectedBook(prevBook);
      setSelectedChapter(lastChapter);
    }
    scrollToTop();
  };

  const goToNext = () => {
    if (selectedChapter < chapterCount) {
      setSelectedChapter((prev) => prev + 1);
    } else if (currentBookIndex < bookNames.length - 1) {
      const nextBook = bookNames[currentBookIndex + 1];
      setSelectedBook(nextBook);
      setSelectedChapter(1);
    }
    scrollToTop();
  };

  if (!isReady) return null;

  const currentVerses = Object.entries(bibleData[selectedBook][selectedChapter.toString()]);

  return (
    <View style={styles.view} onLayout={onLayoutRootView}>
      <View style={styles.topBar}>
        <Pressable style={styles.bookButton} onPress={() => setBookModalVisible(true)}>
          <Text style={styles.topBarText}>{selectedBook}</Text>
        </Pressable>
        <Pressable style={styles.chapterButton} onPress={() => setChapterModalVisible(true)}>
          <Text style={styles.topBarText}>{selectedChapter}</Text>
        </Pressable>
      </View>

      <BookSelectorModal
        isVisible={isBookModalVisible}
        onClose={() => setBookModalVisible(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        filteredBooks={filteredBookNames}
        onSelectBook={onSelectBook}
      />

      <ChapterSelectorModal
        isVisible={isChapterModalVisible}
        onClose={() => setChapterModalVisible(false)}
        chapterList={chapterList}
        onSelectChapter={onSelectChapter}
      />

      <View style={styles.verseContainer}>
        <VerseList verses={currentVerses} />
      </View>

      <NavigationControls
        onNext={goToNext}
        onPrevious={goToPrevious}
        isFirst={isFirstChapter}
        isLast={isLastChapter}
      />
    </View>
  );
}
