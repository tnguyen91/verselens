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
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [showBookSelectionModal, setShowBookSelectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBookInModal, setExpandedBookInModal] = useState<string | null>(null);

  const bookNames = useMemo(() => Object.keys(currentTranslation.data), [currentTranslation.data]);
  
  const bookChapterModalData = useMemo(() => {
    const filteredBookNames = bookNames.filter((book) =>
      book.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const result: ModalListItem[] = [];
    
    filteredBookNames.forEach(bookName => {
      result.push({ type: 'book', bookName });
      
      if (expandedBookInModal === bookName) {
        const bookData = currentTranslation.data[bookName];
        if (bookData) {
          const chapterNumbers = Object.keys(bookData).map(Number).sort((a, b) => a - b);
          chapterNumbers.forEach(chapterNum => {
            result.push({
              type: 'chapter',
              bookName,
              chapterNumber: chapterNum
            });
          });
        }
      }
    });

    return result;
  }, [searchQuery, bookNames, expandedBookInModal, currentTranslation.data]);

  const handleBookToggleInModal = useCallback((book: string) => {
    setExpandedBookInModal(expandedBookInModal === book ? null : book);
  }, [expandedBookInModal]);

  const handleChapterSelectFromModal = useCallback((book: string, chapter: number) => {
    setShowBookSelectionModal(false);
    setBook(book);
    setChapter(chapter);
    setExpandedBookInModal(null);
  }, [setBook, setChapter]);

  const handleBookSelectionModalClose = useCallback(() => {
    setShowBookSelectionModal(false);
  }, []);

  return (
    <>
      <View style={[styles.topBar, { backgroundColor: theme.colors.primary, borderBottomColor: theme.colors.border }]}>
        <View style={styles.leftContainer}>
          <TouchableHighlight
            onPress={() => setShowBookSelectionModal(true)}
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
            onPress={() => setShowTranslationModal(true)}
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
        isVisible={showBookSelectionModal}
        onClose={handleBookSelectionModalClose}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        modalData={bookChapterModalData}
        expandedBook={expandedBookInModal}
        onBookToggle={handleBookToggleInModal}
        onChapterSelect={handleChapterSelectFromModal}
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        setExpandedBook={setExpandedBookInModal}
      />

      <TranslationModal
        isVisible={showTranslationModal}
        onClose={() => setShowTranslationModal(false)}
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
