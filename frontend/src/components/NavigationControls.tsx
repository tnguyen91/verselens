import React from 'react';
import { View, Text, TouchableHighlight, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles';
import { NAVIGATION_BUTTON_SIZE, NAVIGATION_BOTTOM_PADDING } from '../constants/ui';

interface NavigationControlsProps {
  isFirstChapter: boolean;
  isLastChapter: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  isFirstChapter,
  isLastChapter,
  onPrevious,
  onNext,
}) => {
  return (
    <View style={styles.navigationButtonsContainer}>
      {isFirstChapter ? (
        <View style={styles.navigationButtonPlaceholder} />
      ) : (
        <TouchableHighlight
          onPress={onPrevious}
          style={styles.navigationButton}
          underlayColor="#555"
        >
          <Text style={styles.navigationButtonText}>←</Text>
        </TouchableHighlight>
      )}
      {isLastChapter ? (
        <View style={styles.navigationButtonPlaceholder} />
      ) : (
        <TouchableHighlight
          onPress={onNext}
          style={styles.navigationButton}
          underlayColor="#555"
        >
          <Text style={styles.navigationButtonText}>→</Text>
        </TouchableHighlight>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navigationButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingBottom: NAVIGATION_BOTTOM_PADDING,
  },
  
  navigationButtonPlaceholder: {
    width: NAVIGATION_BUTTON_SIZE,
    height: NAVIGATION_BUTTON_SIZE,
  },
  
  navigationButton: {
    width: NAVIGATION_BUTTON_SIZE,
    height: NAVIGATION_BUTTON_SIZE,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
  },
  
  navigationButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
