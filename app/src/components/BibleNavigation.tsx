import React, { useMemo } from 'react';
import { View, TouchableHighlight, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useBible } from '../contexts/BibleContext';
import { BibleDataService } from '../services/BibleDataService';

interface BibleNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
}

export const BibleNavigation: React.FC<BibleNavigationProps> = React.memo(({
  onPrevious,
  onNext,
}) => {
  const { theme } = useTheme();
  const { selectedBook, selectedChapter, currentTranslation } = useBible();
  
  const { canGoPrevious, canGoNext } = useMemo(() => {
    const currentReference = { 
      book: selectedBook, 
      chapter: selectedChapter, 
      translation: currentTranslation.name,
      bibleData: currentTranslation.data
    };
    return {
      canGoPrevious: BibleDataService.canNavigatePrevious(currentReference),
      canGoNext: BibleDataService.canNavigateNext(currentReference)
    };
  }, [selectedBook, selectedChapter, currentTranslation.name, currentTranslation.data]);

  return (
    <View style={styles.navigationButtonsContainer}>
      {!canGoPrevious ? (
        <View style={styles.navigationButtonPlaceholder} />
      ) : (
        <TouchableHighlight
          onPress={onPrevious}
          style={[styles.navigationButton, { 
            backgroundColor: theme.colors.tertiary,
            borderWidth: 1,
            borderColor: theme.colors.border
          }]}
          underlayColor={theme.colors.overlayLight}
        >
          <Icon name="chevron-left" size={24} color={theme.colors.textSecondary} />
        </TouchableHighlight>
      )}
      {!canGoNext ? (
        <View style={styles.navigationButtonPlaceholder} />
      ) : (
        <TouchableHighlight
          onPress={onNext}
          style={[styles.navigationButton, { 
            backgroundColor: theme.colors.tertiary,
            borderWidth: 1,
            borderColor: theme.colors.border
          }]}
          underlayColor={theme.colors.overlayLight}
        >
          <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableHighlight>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  navigationButtonsContainer: {
    position: "absolute",
    bottom: 85, // Position above the tab bar (tab bar height ~70-80px)
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  
  navigationButtonPlaceholder: {
    width: 50,
    height: 50,
  },
  
  navigationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
