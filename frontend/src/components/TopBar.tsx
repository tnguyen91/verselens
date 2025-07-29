import React from 'react';
import { View, Text, TouchableHighlight, Pressable, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles';

interface TopBarProps {
  selectedBook: string;
  selectedChapter: number;
  isTranslateModeEnabled: boolean;
  onBookChapterPress: () => void;
  onDoubleTap: () => void;
  onToggleTranslateMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  selectedBook,
  selectedChapter,
  isTranslateModeEnabled,
  onBookChapterPress,
  onDoubleTap,
  onToggleTranslateMode,
}) => {
  return (
    <Pressable onPress={onDoubleTap} style={styles.topBar}>
      <View style={styles.bookChapterContainer}>
        <TouchableHighlight
          onPress={onBookChapterPress}
          underlayColor="#555"
          style={styles.bookButton}
        >
          <Text style={styles.buttonText}>{selectedBook} {selectedChapter}</Text>
        </TouchableHighlight>
      </View>

      <Pressable
        onPress={onToggleTranslateMode}
        style={styles.modeToggleButton}
      >
        <Icon 
          style={styles.translateIcon}
          name={isTranslateModeEnabled ? "translate" : "translate-off"}
        />
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  
  bookChapterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: "center",
  },
  
  bookButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  
  modeToggleButton: {
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
    backgroundColor: COLORS.accentDark,
    ...SHADOWS.sm,
  },
  
  translateIcon: {
    fontSize: TYPOGRAPHY.sizes.huge,
    color: COLORS.textPrimary,
  },
});
