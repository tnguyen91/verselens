import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { BibleDataService } from '../services/BibleDataService';
import { DictionaryEntry } from '../types/bible';

interface WordDefinitionModalProps {
  word: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export const WordDefinitionModal = React.memo<WordDefinitionModalProps>(({
  word,
  isVisible,
  onClose,
}) => {
  const { theme } = useTheme();
  const [definitions, setDefinitions] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    const configureAudio = async () => {
      if (Platform.OS === 'web') {
        return;
      }
      
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.warn('Failed to configure audio mode:', error);
      }
    };
    
    configureAudio();
  }, []);

  const fetchDefinition = useCallback(async (searchWord: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await BibleDataService.fetchWordDefinition(searchWord);
      setDefinitions(result);
    } catch (err) {
      setError('Definition not found');
      console.error('Error fetching definition:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const playPronunciation = useCallback(async (audioUrl: string) => {
    if (Platform.OS === 'web') {
      try {
        const audio = new window.Audio(audioUrl);
        setIsPlayingAudio(true);
        await audio.play();
        audio.onended = () => setIsPlayingAudio(false);
      } catch (error) {
        console.warn('Web audio playback not supported:', error);
        setIsPlayingAudio(false);
      }
      return;
    }

    try {
      setIsPlayingAudio(true);
      
      if (currentSound) {
        await currentSound.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setCurrentSound(sound);
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
          setCurrentSound(null);
        }
      });
      
    } catch (error) {
      console.warn('Audio playback not supported or failed:', error);
      setIsPlayingAudio(false);
      setCurrentSound(null);
    }
  }, [currentSound]);

  useEffect(() => {
    if (!isVisible && currentSound) {
      currentSound.unloadAsync();
      setCurrentSound(null);
      setIsPlayingAudio(false);
    }
  }, [isVisible, currentSound]);

  useEffect(() => {
    if (isVisible && word) {
      setCurrentWord(word);
      fetchDefinition(word);
    } else if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentWord(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, word, fetchDefinition]);

  const mainEntry = useMemo(() => definitions[0], [definitions]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
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
      avoidKeyboard={false}
    >
      {currentWord && (
        <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.secondary, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.wordTitle, { color: theme.colors.textPrimary }]}>
              {currentWord}
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCloseButton, { 
                backgroundColor: theme.colors.tertiary,
                borderWidth: 1,
                borderColor: theme.colors.border
              }]}
            >
              <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                Loading definition...
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={48} color={theme.colors.textMuted} />
              <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>
                {error}
              </Text>
            </View>
          )}

          {mainEntry && !loading && (
            <>
              {(mainEntry.phonetic || mainEntry.phonetics?.length > 0) && (
                <View style={[styles.pronunciationSection, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.phoneticText, { color: theme.colors.textMuted }]}>
                    {mainEntry.phonetic || mainEntry.phonetics[0]?.text}
                  </Text>
                  {(() => {
                    const audioPhonetic = mainEntry.phonetics?.find(p => p.audio);
                    return audioPhonetic?.audio ? (
                      <TouchableOpacity 
                        style={[styles.pronunciationButton, { 
                          backgroundColor: theme.colors.tertiary,
                        }]}
                        onPress={() => playPronunciation(audioPhonetic.audio!)}
                        disabled={isPlayingAudio}
                      >
                        <Icon 
                          name={isPlayingAudio ? "volume-high" : "volume-low"} 
                          size={20} 
                          color={isPlayingAudio ? theme.colors.accent : theme.colors.textMuted} 
                        />
                      </TouchableOpacity>
                    ) : null;
                  })()}
                </View>
              )}

              <View style={styles.definitionsSection}>
                {mainEntry.meanings.slice(0, 2).map((meaning, meaningIndex) => (
                  <View key={meaningIndex} style={styles.meaningGroup}>
                    <Text style={[styles.partOfSpeech, { color: theme.colors.accent }]}>
                      {meaning.partOfSpeech}
                    </Text>
                    {meaning.definitions.slice(0, 2).map((def, defIndex) => (
                      <View key={defIndex} style={[styles.definitionItem, { borderLeftColor: theme.colors.border }]}>
                        <Text style={[styles.definitionText, { color: theme.colors.textPrimary }]}>
                          {def.definition}
                        </Text>
                        {def.example && (
                          <Text style={[styles.exampleText, { color: theme.colors.textMuted }]}>
                            "{def.example}"
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
      )}
    </Modal>
  );
});

WordDefinitionModal.displayName = 'WordDefinitionModal';

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    margin: 0,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  wordTitle: {
    fontSize: 24,
    fontWeight: "600",
    textTransform: 'capitalize',
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 32 + 20,
    alignItems: 'center',
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
  pronunciationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  phoneticText: {
    fontSize: 20,
    fontStyle: 'italic',
  },
  pronunciationButton: {
    padding: 4,
    borderRadius: 10,
  },
  definitionsSection: {
    paddingVertical: 20,
    gap: 20,
  },
  meaningGroup: {
    gap: 15,
  },
  partOfSpeech: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  definitionItem: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    gap: 4,
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 20,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
