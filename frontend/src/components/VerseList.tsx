import React, { useCallback, forwardRef } from 'react';
import { View, FlatList, StyleSheet, ListRenderItem } from 'react-native';
import { VerseDisplayItem } from './VerseDisplayItem';
import { COLORS, SPACING } from '../styles';
import { FLATLIST_PERFORMANCE_CONFIG } from '../constants/performance';
import { NAVIGATION_TOTAL_HEIGHT } from '../constants/ui';

interface VerseListProps {
  verses: [string, string][];
  selectedBook: string;
  selectedChapter: number;
}

export const VerseList = forwardRef<FlatList, VerseListProps>(({
  verses,
  selectedBook,
  selectedChapter,
}, ref) => {
  const renderVerseItem: ListRenderItem<[string, string]> = useCallback(({ item: [verseNumber, verseText] }) => (
    <VerseDisplayItem verseNumber={verseNumber} verseText={verseText} />
  ), []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: FLATLIST_PERFORMANCE_CONFIG.VERSES.ITEM_HEIGHT,
    offset: FLATLIST_PERFORMANCE_CONFIG.VERSES.ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={ref}
        ListHeaderComponent={<View style={{ height: 10 }} />}
        data={verses}
        keyExtractor={([verseNumber]) => `${selectedBook}-${selectedChapter}-${verseNumber}`}
        removeClippedSubviews={true}
        maxToRenderPerBatch={FLATLIST_PERFORMANCE_CONFIG.VERSES.MAX_TO_RENDER_PER_BATCH}
        windowSize={FLATLIST_PERFORMANCE_CONFIG.VERSES.WINDOW_SIZE}
        initialNumToRender={FLATLIST_PERFORMANCE_CONFIG.VERSES.INITIAL_NUM_TO_RENDER}
        updateCellsBatchingPeriod={FLATLIST_PERFORMANCE_CONFIG.VERSES.UPDATE_CELLS_BATCHING_PERIOD}
        getItemLayout={getItemLayout}
        renderItem={renderVerseItem}
        ListFooterComponent={<View style={{ height: NAVIGATION_TOTAL_HEIGHT }} />}
      />
    </View>
  );
});

VerseList.displayName = 'VerseList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
});
