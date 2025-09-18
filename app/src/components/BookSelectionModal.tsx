import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ListRenderItem,
  Keyboard,
  Animated,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { BookSelectionModalProps } from '../types/components';
import { ModalListItem } from '../types/bible';

export const BookSelectionModal: React.FC<BookSelectionModalProps> = React.memo(({
  isVisible,
  onClose,
  searchQuery,
  onSearchChange,
  onClearSearch,
  modalData,
  expandedBook,
  onBookToggle,
  onChapterSelect,
  currentBook,
  currentChapter,
  setExpandedBook,
}) => {
  const { theme } = useTheme();
  const [isContentVisible, setIsContentVisible] = useState(false);
  const animatedHeights = useRef<Map<string, Animated.Value>>(new Map());
  const flatListRef = useRef<FlatList>(null);

  const booksOnlyData = useMemo(() => 
    modalData.filter(item => item.type === 'book'), 
    [modalData]
  );

  const getOrCreateAnimatedValue = useCallback((bookName: string) => {
    if (!animatedHeights.current.has(bookName)) {
      const newValue = new Animated.Value(0);
      animatedHeights.current.set(bookName, newValue);
      return newValue;
    }
    return animatedHeights.current.get(bookName)!;
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
        const timer = setTimeout(() => {
          setIsContentVisible(false);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && currentBook) {
      setExpandedBook(currentBook);
    }
  }, [isVisible, currentBook, setExpandedBook]);

  useEffect(() => {
    if (isVisible && currentBook && isContentVisible) {
      const currentBookIndex = booksOnlyData.findIndex((item: Extract<ModalListItem, { type: 'book' }>) => item.bookName === currentBook);
      if (currentBookIndex >= 0 && flatListRef.current) {
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: currentBookIndex,
            animated: true,
            viewPosition: 0.1,
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, currentBook, isContentVisible, booksOnlyData]);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setExpandedBook(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, setExpandedBook]);

  useEffect(() => {
    modalData.forEach(item => {
      if (item.type === 'book') {
        const animatedValue = getOrCreateAnimatedValue(item.bookName);
        const isExpanded = expandedBook === item.bookName;
        const chaptersCount = modalData.filter(
          i => i.type === 'chapter' && i.bookName === item.bookName
        ).length;
        
        Animated.timing(animatedValue, {
          toValue: isExpanded ? chaptersCount * 60 : 0, 
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [expandedBook, modalData, getOrCreateAnimatedValue]);

  const chaptersData = useMemo(() => {
    const chapters = new Map<string, Extract<ModalListItem, { type: 'chapter' }>[]>();
    modalData.forEach(item => {
      if (item.type === 'chapter') {
        const existing = chapters.get(item.bookName) || [];
        existing.push(item);
        chapters.set(item.bookName, existing);
      }
    });
    return chapters;
  }, [modalData]);
  
  const renderModalItem: ListRenderItem<ModalListItem> = useCallback(({ item }) => {
    if (item.type === 'book') {
      const chaptersForThisBook = chaptersData.get(item.bookName) || [];
      const animatedHeight = getOrCreateAnimatedValue(item.bookName);
      const isCurrentBook = item.bookName === currentBook;
      
      return (
        <View>
          <TouchableHighlight
            onPress={() => onBookToggle(item.bookName)}
            underlayColor={theme.colors.overlayLight}
            style={[
              styles.bookItem, 
              { borderBottomColor: theme.colors.borderLight },
              expandedBook === item.bookName && [styles.expandedBookItem, { backgroundColor: theme.colors.card }],
              isCurrentBook && [styles.currentBookItem, { 
                backgroundColor: theme.colors.highlight,
                borderLeftColor: theme.colors.accent 
              }]
            ]}
          >
            <View style={styles.bookItemContent}>
              <View style={styles.bookNameContainer}>
                <Text style={[styles.bookItemText, { color: theme.colors.textPrimary }]}>{item.bookName}</Text>
              </View>
              <Text style={[styles.expandIcon, { color: theme.colors.textMuted }]}>
                {expandedBook === item.bookName ? '▲' : '▼'}
              </Text>
            </View>
          </TouchableHighlight>
          
          <Animated.View 
            style={[
              styles.chaptersContainer,
              { 
                height: animatedHeight,
                overflow: 'hidden',
                backgroundColor: theme.colors.card,
              }
            ]}
          >
            {chaptersForThisBook.map((chapterItem) => {
              const isCurrentChapter = chapterItem.bookName === currentBook && chapterItem.chapterNumber === currentChapter;
              return (
                <TouchableHighlight
                  key={`${chapterItem.bookName}-${chapterItem.chapterNumber}`}
                  onPress={() => onChapterSelect(chapterItem.bookName, chapterItem.chapterNumber)}
                  underlayColor={theme.colors.overlayLight}
                  style={[
                    styles.chapterItemInBook,
                    { 
                      backgroundColor: theme.colors.card,
                      borderBottomColor: theme.colors.borderLight,
                      borderLeftColor: theme.colors.accent,
                    },
                    isCurrentChapter && [styles.currentChapterItem, { 
                      backgroundColor: theme.colors.highlight,
                      borderLeftColor: theme.colors.accent,
                    }]
                  ]}
                >
                  <View style={styles.chapterItemContent}>
                    <Text style={[styles.chapterItemInBookText, { color: theme.colors.textSecondary }]}>
                      Chapter {chapterItem.chapterNumber}
                    </Text>
                  </View>
                </TouchableHighlight>
              );
            })}
          </Animated.View>
        </View>
      );
    } else {
      return null;
    }
  }, [onBookToggle, onChapterSelect, expandedBook, chaptersData, getOrCreateAnimatedValue, currentBook, currentChapter, theme.colors]);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: 60,
    offset: 60 * index,
    index,
  }), []);

  return (
    <Modal
      isVisible={isVisible}
      onSwipeComplete={onClose}
      onBackdropPress={onClose}
      swipeDirection="down"
      style={styles.modal}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
      backdropOpacity={0.5}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={300}
      avoidKeyboard={false}
    >
      {isContentVisible && (
        <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.secondary, borderBottomColor: theme.colors.border }]}>
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.tertiary }]}>
              <Icon name="magnify" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                placeholder="Search books..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={onSearchChange}
                multiline={false}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={onClearSearch}
                  style={styles.clearButton}
                >
                  <Icon name="close" size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCloseButton, { 
                backgroundColor: theme.colors.tertiary,
                borderWidth: 1,
                borderColor: theme.colors.border
              }]}
            >
              <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <FlatList
              ref={flatListRef}
              data={booksOnlyData}
              keyExtractor={(item) => item.bookName}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={21}
              initialNumToRender={10}
              getItemLayout={getItemLayout}
              renderItem={renderModalItem}
              onScroll={() => Keyboard.dismiss()}
              onScrollToIndexFailed={(error) => {
                console.warn('Scroll to index failed:', error);
                const offset = error.index * 60;
                flatListRef.current?.scrollToOffset({ offset, animated: true });
              }}
              ListFooterComponent={<View style={{ height: 100 }} />}
            />
          </View>
        </View>
      )}
    </Modal>
  );
});

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    backgroundColor: 'transparent',
    margin: 0,
  },
  
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: '90%',
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  
  content: {
    flex: 1,
  },
  
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
  },
  
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  
  modalClose: {
    fontSize: 16,
    fontWeight: "500",
  },
  
  bookItem: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  
  bookItemText: {
    fontSize: 18,
    fontWeight: "500",
  },
  
  expandedBookItem: {
  },
  
  bookItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  chaptersContainer: {
    flex: 1,
  },
  
  expandIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  
  chapterItemInBook: {
    paddingVertical: 16,
    paddingHorizontal: 40 + 8,
    borderBottomWidth: 1,
    borderLeftWidth: 2,
  },
  
  chapterItemInBookText: {
    fontSize: 16,
    fontWeight: "500",
  },

  currentBookItem: {
    borderLeftWidth: 3,
  },

  bookNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  currentBookIcon: {
    marginLeft: 4,
  },

  currentChapterItem: {
    borderLeftWidth: 4,
  },

  chapterItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
