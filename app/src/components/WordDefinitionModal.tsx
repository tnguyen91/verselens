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
import { DictionaryService } from '../services/DictionaryService';
import { DictionaryEntry, DictionaryPhonetic } from '../types/bible';

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
  const [definitions, setDefinitions] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [activeTab, setActiveTab] = useState<string>('wordnet');

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
      const result = await DictionaryService.fetchWordDefinition(searchWord);
      setDefinitions(result);
      // Set default active tab to wordnet if available, otherwise easton
      setActiveTab(result.definitions.wordnet ? 'wordnet' : (result.definitions.easton ? 'easton' : ''));
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

  const availableTabs = useMemo(() => {
    if (!definitions) return [];
    const tabs: string[] = [];
    if (definitions.definitions.wordnet && definitions.definitions.wordnet.length > 0) {
      tabs.push('wordnet');
    }
    if (definitions.definitions.easton && definitions.definitions.easton.length > 0) {
      tabs.push('easton');
    }
    return tabs;
  }, [definitions]);
  
  const currentDefinitions = useMemo(() => {
    if (!definitions || !activeTab) return [];
    return definitions.definitions[activeTab as keyof typeof definitions.definitions] || [];
  }, [definitions, activeTab]);
  
  const phoneticsWithAudio = useMemo(() => {
    if (!definitions?.pronounciation) return [];
    return definitions.pronounciation.filter((p: DictionaryPhonetic) => p.text && p.audio);
  }, [definitions]);

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

          {definitions && !loading && (
            <>
              {phoneticsWithAudio.length > 0 && (
                <View style={[styles.pronunciationSection, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.pronunciationLabel, { color: theme.colors.textMuted }]}>
                    Pronunciation:
                  </Text>
                  <View style={styles.phoneticsList}>
                    {phoneticsWithAudio.map((phonetic: DictionaryPhonetic, index: number) => (
                      <TouchableOpacity 
                        key={index}
                        style={[styles.pronunciationButton, { 
                          backgroundColor: theme.colors.tertiary,
                          borderColor: theme.colors.border
                        }]}
                        onPress={() => playPronunciation(phonetic.audio!)}
                        disabled={isPlayingAudio}
                      >
                        <Text style={[styles.phoneticText, { color: theme.colors.textPrimary }]}>
                          {phonetic.text}
                        </Text>
                        <Icon 
                          name={isPlayingAudio ? "volume-high" : "volume-medium"} 
                          size={18} 
                          color={isPlayingAudio ? theme.colors.accent : theme.colors.textMuted} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {availableTabs.length > 1 && (
                <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
                  {availableTabs.map((tab: string) => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tabButton,
                        {
                          backgroundColor: activeTab === tab ? theme.colors.accent : theme.colors.tertiary,
                          borderColor: theme.colors.border
                        }
                      ]}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text style={[
                        styles.tabText,
                        {
                          color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary,
                          fontWeight: activeTab === tab ? '600' : '500'
                        }
                      ]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {currentDefinitions.length > 0 && (
                <View style={styles.definitionsSection}>
                  <View style={styles.meaningGroup}>
                    {availableTabs.length === 1 && (
                      <Text style={[styles.partOfSpeech, { color: theme.colors.accent }]}>
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                      </Text>
                    )}
                    {currentDefinitions.map((definition: string, defIndex: number) => (
                      <View key={defIndex} style={[styles.definitionItem, { borderLeftColor: theme.colors.border }]}>
                        <Text style={[styles.definitionText, { color: theme.colors.textPrimary }]}>
                          {definition}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
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
    flexDirection: 'column',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pronunciationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneticsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phoneticText: {
    fontSize: 16,
    fontStyle: 'italic',
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
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
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
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
