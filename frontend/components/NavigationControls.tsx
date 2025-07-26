import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './styles';

type Props = {
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
};

const NavigationControls: React.FC<Props> = ({ onNext, onPrevious, isFirst, isLast }) => (
  <View style={styles.navButtonsContainer}>
    {isFirst ? (
      <View style={styles.navButtonPlaceholder} />
    ) : (
      <Pressable style={styles.navButton} onPress={onPrevious}>
        <Text style={styles.navButtonText}>←</Text>
      </Pressable>
    )}

    {isLast ? (
      <View style={styles.navButtonPlaceholder} />
    ) : (
      <Pressable style={styles.navButton} onPress={onNext}>
        <Text style={styles.navButtonText}>→</Text>
      </Pressable>
    )}
  </View>
);

export default NavigationControls;