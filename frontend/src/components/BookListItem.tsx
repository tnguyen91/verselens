import React, { memo } from 'react';
import { Text, TouchableHighlight, StyleSheet } from 'react-native';
import { BookListItemProps } from '../types/bible';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles';

export const BookListItem = memo<BookListItemProps>(({ item, onPress }) => (
  <TouchableHighlight
    onPress={() => onPress(item)}
    underlayColor="#222"
    style={styles.bookItem}
  >
    <Text style={styles.bookItemText}>{item}</Text>
  </TouchableHighlight>
));

BookListItem.displayName = 'BookListItem';

const styles = StyleSheet.create({
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
});
