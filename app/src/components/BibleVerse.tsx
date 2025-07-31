import React, { memo, useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useUserData } from '../contexts/UserDataContext';
import { useTranslationMode } from '../contexts/TranslationModeContext';
import { WordDefinitionModal } from './WordDefinitionModal';

interface BibleVerseProps {
  verseNumber: string;
  verseText: string;
  isBookmarked?: boolean;
  onBookmarkToggle?: (verse: number, text: string) => void;
}

export const BibleVerse = memo<BibleVerseProps>(({
  verseNumber,
  verseText,
  isBookmarked = false,
  onBookmarkToggle,
}) => {
  const { theme } = useTheme();
  const { fontSize } = useUserData();
  const { translationMode } = useTranslationMode();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showWordDefinition, setShowWordDefinition] = useState(false);

  const handleBookmarkToggle = useCallback(() => {
    if (verseNumber && !isNaN(parseInt(verseNumber))) {
      onBookmarkToggle?.(parseInt(verseNumber), verseText);
    }
  }, [verseNumber, verseText, onBookmarkToggle]);

  const handleWordPress = useCallback((word: string) => {
    if (translationMode) {
      const cleanedWord = word.replace(/[^\w]/g, '');
      if (cleanedWord.length > 2) {
        setSelectedWord(cleanedWord);
        setShowWordDefinition(true);
      }
    }
  }, [translationMode]);

  // Memoize word splitting to avoid re-computation on every render
  const words = useMemo(() => {
    return translationMode ? verseText.split(' ') : [];
  }, [verseText, translationMode]);

  const renderTextWithWords = useCallback((text: string) => {
    if (translationMode) {
      // Use pre-computed words array and optimize rendering
      return (
        <Text style={[styles.normalText, { color: theme.colors.textPrimary, fontSize: fontSize }]}>
          {words.map((word, index) => (
            <Text 
              key={index} // Simplified key since words array is stable
              style={[styles.tappableWord, { color: theme.colors.textPrimary, fontSize: fontSize }]}
              onPress={() => handleWordPress(word)}
            >
              {word}{index < words.length - 1 ? ' ' : ''}
            </Text>
          ))}
        </Text>
      );
    } else {
      // In bookmark mode, show normal text
      return (
        <Text style={[styles.normalText, { color: theme.colors.textPrimary, fontSize: fontSize }]}>
          {text}
        </Text>
      );
    }
  }, [translationMode, fontSize, theme.colors.textPrimary, handleWordPress, words]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.verseContainer}
        onLongPress={translationMode ? undefined : handleBookmarkToggle}
        activeOpacity={0.7}
        disabled={translationMode}
      >
        <Text style={[styles.verse, { color: theme.colors.textPrimary, fontSize: fontSize }]}>
          {verseNumber && (
            <Text style={[styles.verseLabel, { color: theme.colors.textMuted, fontSize: fontSize - 2 }]}>
              {verseNumber}.{' '}
            </Text>
          )}
          {renderTextWithWords(verseText)}
        </Text>
        
        {isBookmarked && (
          <Icon
            name="bookmark"
            size={16}
            color={theme.colors.accent}
            style={styles.bookmarkIcon}
          />
        )}
      </TouchableOpacity>

      {translationMode && (
        <WordDefinitionModal
          word={selectedWord}
          isVisible={showWordDefinition}
          onClose={() => {
            setShowWordDefinition(false);
            setSelectedWord(null);
          }}
        />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.verseNumber === nextProps.verseNumber &&
         prevProps.verseText === nextProps.verseText &&
         prevProps.isBookmarked === nextProps.isBookmarked;
});

BibleVerse.displayName = 'BibleVerse';

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    position: 'relative',
  },
  verseContainer: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    position: 'relative',
  },
  verse: {
    fontFamily: "times",
    lineHeight: 28,
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  verseLabel: {
    fontFamily: "times",
    fontWeight: 'bold',
  },
  tappableWord: {
    fontFamily: "times",
    lineHeight: 28,
  },
  normalText: {
    fontFamily: "times",
    lineHeight: 28,
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
