import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableHighlight, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useBible } from '../contexts/BibleContext';
import { useTranslationMode } from '../contexts/TranslationModeContext';
import { TranslationModal } from './TranslationModal';
import { BookSelectionModal } from './BookSelectionModal';
import { ModalListItem } from '../types/bible';
import { platformStyles } from '../utils/platform';

export const BibleHeader = () => {
  const { theme } = useTheme();
  const { currentTranslation, loadingRemoteTranslation, selectedBook, selectedChapter, setBook, setChapter } = useBible();
  const { translationMode, toggleTranslationMode } = useTranslationMode();
  const [isTranslationModalVisible, setIsTranslationModalVisible] = useState(false);
  const [isBookSelectionModalVisible, setIsBookSelectionModalVisible] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [expandedBookName, setExpandedBookName] = useState<string | null>(null);

  const availableBookNames = useMemo(() => Object.keys(currentTranslation.data), [currentTranslation.data]);
  
  const bookSelectionModalData = useMemo(() => {
    const filteredBooks = availableBookNames.filter((bookName) =>
      bookName.toLowerCase().includes(bookSearchQuery.toLowerCase())
    );
    
    const modalItems: ModalListItem[] = [];
    
    filteredBooks.forEach(bookName => {
      modalItems.push({ type: 'book', bookName });
      
      if (expandedBookName === bookName) {
        const bookData = currentTranslation.data[bookName];
        if (bookData) {
          const chapterNumbers = Object.keys(bookData).map(Number).sort((a, b) => a - b);
          chapterNumbers.forEach(chapterNumber => {
            modalItems.push({
              type: 'chapter',
              bookName,
              chapterNumber
            });
          });
        }
      }
    });

    return modalItems;
  }, [bookSearchQuery, availableBookNames, expandedBookName, currentTranslation.data]);

  const handleBookExpansionToggle = useCallback((bookName: string) => {
    setExpandedBookName(expandedBookName === bookName ? null : bookName);
  }, [expandedBookName]);

  const handleChapterSelection = useCallback((bookName: string, chapterNumber: number) => {
    setIsBookSelectionModalVisible(false);
    setBook(bookName);
    setChapter(chapterNumber);
    setExpandedBookName(null);
  }, [setBook, setChapter]);

  const handleBookSelectionModalClose = useCallback(() => {
    setIsBookSelectionModalVisible(false);
  }, []);

  return (
    <>
      <View style={[styles.topBar, { backgroundColor: theme.colors.primary, borderBottomColor: theme.colors.border }]}>
        <View style={styles.leftContainer}>
          <TouchableHighlight
            onPress={() => setIsBookSelectionModalVisible(true)}
            underlayColor={theme.colors.overlayLight}
            style={[styles.bookButton, { 
              backgroundColor: theme.colors.tertiary,
              borderWidth: 1,
              borderColor: theme.colors.border
            }]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {selectedBook} {selectedChapter}
            </Text>
          </TouchableHighlight>

          <TouchableHighlight
            onPress={() => setIsTranslationModalVisible(true)}
            underlayColor={theme.colors.overlayLight}
            style={[styles.translationButton, { 
              backgroundColor: theme.colors.tertiary,
              borderWidth: 1,
              borderColor: theme.colors.border
            }]}
          >
            <View style={styles.translationContent}>
              <Text style={[styles.translationText, { color: theme.colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {currentTranslation.name}
              </Text>
              {loadingRemoteTranslation && (
                <Icon name="loading" size={12} color={theme.colors.textMuted} />
              )}
            </View>
          </TouchableHighlight>
        </View>

        <View style={styles.rightContainer}>
          <Pressable
            style={[styles.toggleButton, { 
              backgroundColor: theme.colors.tertiary,
              borderWidth: 1,
              borderColor: theme.colors.border
            }]}
            onPress={toggleTranslationMode}
          >
            <Icon
              name={translationMode ? "translate" : "translate-off"}
              size={24}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <BookSelectionModal
        isVisible={isBookSelectionModalVisible}
        onClose={handleBookSelectionModalClose}
        searchQuery={bookSearchQuery}
        onSearchChange={setBookSearchQuery}
        onClearSearch={() => setBookSearchQuery('')}
        modalData={bookSelectionModalData}
        expandedBook={expandedBookName}
        onBookToggle={handleBookExpansionToggle}
        onChapterSelect={handleChapterSelection}
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        setExpandedBook={setExpandedBookName}
      />

      <TranslationModal
        isVisible={isTranslationModalVisible}
        onClose={() => setIsTranslationModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 10,
    ...platformStyles.statusBarPadding,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    ...platformStyles.shadow,
  },
  
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'flex-start',
    gap: 3,
  },
  
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: "center",
    flexShrink: 1,
  },
  
  bookButton: {
    padding: 12,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  translationButton: {
    padding: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  
  translationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  translationText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: "center",
    flexShrink: 1,
  },
  
  toggleButton: {
    padding: 12,
    borderRadius: 8,
  },
});
