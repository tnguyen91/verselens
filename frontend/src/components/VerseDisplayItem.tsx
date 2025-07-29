import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VerseDisplayItemProps } from '../types/bible';
import { COLORS, SPACING, TYPOGRAPHY } from '../styles';

export const VerseDisplayItem = memo<VerseDisplayItemProps>(({ verseNumber, verseText }) => (
  <View style={styles.verseItemContainer}>
    <Text style={styles.verse}>
      <Text style={styles.verseLabel}>{verseNumber}. </Text>
      {verseText}
    </Text>
  </View>
), (prevProps, nextProps) => {
  return prevProps.verseNumber === nextProps.verseNumber && 
         prevProps.verseText === nextProps.verseText;
});

VerseDisplayItem.displayName = 'VerseDisplayItem';

const styles = StyleSheet.create({
  verseItemContainer: {
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  
  verse: {
    fontFamily: "times-new-roman",
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.xxl,
    marginBottom: SPACING.md,
    lineHeight: 32,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  
  verseLabel: {
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
