import React, { useState } from 'react';
import { View, Text, TouchableHighlight, TouchableOpacity, StyleSheet, StatusBar, Platform, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useBible } from '../contexts/BibleContext';
import { useTranslationMode } from '../contexts/TranslationModeContext';
import { TranslationModal } from './TranslationModal';

interface BibleHeaderProps {
  onBookChapterPress: () => void;
}

export const BibleHeader: React.FC<BibleHeaderProps> = ({
  onBookChapterPress,
}) => {
  const { theme } = useTheme();
  const { currentTranslation, loadingRemoteTranslation, selectedBook, selectedChapter } = useBible();
  const { translationMode, toggleTranslationMode } = useTranslationMode();
  const [showTranslationModal, setShowTranslationModal] = useState(false);

  return (
    <>
      <View style={[styles.topBar, { backgroundColor: theme.colors.primary, borderBottomColor: theme.colors.border }]}>
        <View style={styles.leftContainer}>
          <TouchableHighlight
            onPress={onBookChapterPress}
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
    paddingTop: Platform.OS === 'web' ? 10 : (StatusBar.currentHeight || 10),
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
