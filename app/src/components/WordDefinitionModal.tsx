import React, { useState, useEffect, useCallback } from 'react';
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
import { DictionaryService } from '../services/DictionaryService';
import { DictionaryEntry } from '../types/bible';

interface WordDefinitionModalProps {
  word: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export const WordDefinitionModal = React.memo<WordDefinitionModalProps>(({
  word,
  isVisible,
  onClose
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
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
    setDefinition(null);
    
    try {
      const result = await DictionaryService.fetchWordDefinition(searchWord);
      setDefinition(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch definition');
    } finally {
      setLoading(false);
    }
  }, []);

  const groupDefinitionsByPOS = useCallback((definitions: string[]) => {
    const grouped: Record<string, string[]> = {};
    
    definitions.forEach(def => {
      const match = def.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const [, pos, definition] = match;
        const posKey = pos.trim().toLowerCase();
        if (!grouped[posKey]) {
          grouped[posKey] = [];
        }
        grouped[posKey].push(definition.trim());
      } else {
        if (!grouped['other']) {
          grouped['other'] = [];
        }
        grouped['other'].push(def);
      }
    });
    
    return grouped;
  }, []);

  const formatPOSLabel = useCallback((pos: string) => {
    const posLabels: Record<string, string> = {
      'noun': 'Nouns',
      'verb': 'Verbs',
      'adjective': 'Adjectives',
      'adjective satellite': 'Similar Adjectives',
      'adverb': 'Adverbs',
      'other': 'Other'
    };
    
    return posLabels[pos] || pos.charAt(0).toUpperCase() + pos.slice(1) + 's';
  }, []);

  const playPronunciation = useCallback(async (audioUrl: string) => {
    if (Platform.OS === 'web') {
      try {
        const audio = new window.Audio(audioUrl);
        setPlayingAudioUrl(audioUrl);
        await audio.play();
        audio.onended = () => setPlayingAudioUrl(null);
      } catch (error) {
        console.warn('Web audio playback not supported:', error);
        setPlayingAudioUrl(null);
      }
      return;
    }

    try {
      setPlayingAudioUrl(audioUrl);
      
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
          setPlayingAudioUrl(null);
          setCurrentSound(null);
        }
      });
      
    } catch (error) {
      console.warn('Audio playback not supported or failed:', error);
      setPlayingAudioUrl(null);
      setCurrentSound(null);
    }
  }, [currentSound]);

  useEffect(() => {
    if (!isVisible && currentSound) {
      currentSound.unloadAsync();
      setCurrentSound(null);
      setPlayingAudioUrl(null);
    }
  }, [isVisible, currentSound]);

  useEffect(() => {
    if (isVisible && word) {
      setCurrentWord(word);
      fetchDefinition(word);
    } else if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentWord(null);
        setDefinition(null);
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, word, fetchDefinition]);

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

          {definition && !loading && !error && (
            <View>
              {/* Pronunciation Section */}
              {definition.pronounciation && definition.pronounciation.length > 0 && (
                <View style={[styles.pronunciationSection, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.phoneticsList}>
                    {definition.pronounciation.map((phonetic, index) => (
                      <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {phonetic.text && phonetic.audio && (
                          <TouchableOpacity
                            onPress={() => playPronunciation(phonetic.audio!)}
                            disabled={playingAudioUrl === phonetic.audio}
                            style={[
                              styles.pronunciationButton,
                              {
                                backgroundColor: theme.colors.tertiary,
                                borderColor: theme.colors.border,
                                opacity: playingAudioUrl === phonetic.audio ? 0.6 : 1,
                              },
                            ]}
                          >
                            <Text style={[styles.tabText, { color: theme.colors.textSecondary }]}>
                              {phonetic.text}
                            </Text>

                            <Icon
                              name={playingAudioUrl === phonetic.audio ? "volume-high" : "volume-low"}
                              size={16}
                              color={theme.colors.textSecondary}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Definitions Section */}
              {definition.definitions && (
                <View style={styles.definitionsSection}>
                  {definition.definitions.wordnet && definition.definitions.wordnet.length > 0 && (() => {
                    const groupedDefinitions = groupDefinitionsByPOS(definition.definitions.wordnet);
                    const posOrder = ['noun', 'verb', 'adjective', 'adjective satellite', 'adverb', 'other'];
                    const sortedPOS = Object.keys(groupedDefinitions).sort((a, b) => {
                      const indexA = posOrder.indexOf(a);
                      const indexB = posOrder.indexOf(b);
                      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });

                    return sortedPOS.map(pos => (
                      <View key={pos} style={styles.meaningGroup}>
                        <Text style={[styles.partOfSpeech, { color: theme.colors.accent }]}>
                          {formatPOSLabel(pos)}
                        </Text>
                        {groupedDefinitions[pos].map((def, index) => (
                          <View key={`${pos}-${index}`} style={[styles.definitionItem, { borderLeftColor: theme.colors.accent }]}>
                            <Text style={[styles.definitionText, { color: theme.colors.textPrimary }]}>
                              {def}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              )}
            </View>
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
    flexDirection: 'column',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  phoneticsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pronunciationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
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
});
