import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableHighlight,
  Pressable,
  FlatList,
  StyleSheet,
  ListRenderItem,
  Keyboard,
} from 'react-native';
import Modal from 'react-native-modal';
import { ModalListItem } from '../types/bible';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles';
import { FLATLIST_PERFORMANCE_CONFIG } from '../constants/performance';

interface BookSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  modalData: ModalListItem[];
  expandedBook: string | null;
  onBookToggle: (bookName: string) => void;
  onChapterSelect: (bookName: string, chapter: number) => void;
}

export const BookSelectionModal: React.FC<BookSelectionModalProps> = ({
  isVisible,
  onClose,
  searchQuery,
  onSearchChange,
  onClearSearch,
  modalData,
  expandedBook,
  onBookToggle,
  onChapterSelect,
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);

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
  const renderModalItem: ListRenderItem<ModalListItem> = useCallback(({ item }) => {
    if (item.type === 'book') {
      return (
        <TouchableHighlight
          onPress={() => onBookToggle(item.bookName)}
          underlayColor="#222"
          style={[styles.bookItem, expandedBook === item.bookName && styles.expandedBookItem]}
        >
          <View style={styles.bookItemContent}>
            <Text style={styles.bookItemText}>{item.bookName}</Text>
            <Text style={styles.expandIcon}>
              {expandedBook === item.bookName ? '▲' : '▼'}
            </Text>
          </View>
        </TouchableHighlight>
      );
    } else {
      return (
        <TouchableHighlight
          onPress={() => onChapterSelect(item.bookName, item.chapterNumber)}
          underlayColor="#333"
          style={styles.chapterItemInBook}
        >
          <Text style={styles.chapterItemInBookText}>Chapter {item.chapterNumber}</Text>
        </TouchableHighlight>
      );
    }
  }, [onBookToggle, onChapterSelect, expandedBook]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.ITEM_HEIGHT,
    offset: FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.ITEM_HEIGHT * index,
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
      avoidKeyboard={true}
    >
      {isContentVisible && (
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#aaa"
                value={searchQuery}
                onChangeText={onSearchChange}
                multiline={false}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={onClearSearch}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          
          <View style={styles.listContainer}>
            <FlatList
              data={modalData}
              keyExtractor={(item) => item.type === 'book' ? item.bookName : `${item.bookName}-${item.chapterNumber}`}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={true}
              maxToRenderPerBatch={FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.MAX_TO_RENDER_PER_BATCH}
              windowSize={FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.WINDOW_SIZE}
              initialNumToRender={FLATLIST_PERFORMANCE_CONFIG.BOOKS_AND_CHAPTERS.INITIAL_NUM_TO_RENDER}
              getItemLayout={getItemLayout}
              renderItem={renderModalItem}
              onScroll={() => Keyboard.dismiss()}
              ListFooterComponent={<View style={{ height: 100 }} />}
            />
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    backgroundColor: 'transparent',
    margin: 0,
    marginTop: 50,
  },
  
  modalContent: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
    overflow: 'hidden',
    height: '100%',
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
  
  listContainer: {
    flex: 1,
  },
  
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
  
  modalCloseButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accentDark,
  },
  
  modalClose: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
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
});
