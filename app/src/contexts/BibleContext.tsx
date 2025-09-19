import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BibleDataService } from '../services/BibleDataService';
import { Translation } from '../types/services';
import { BibleContextType, BibleProviderProps } from '../types/contexts';

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export const BibleProvider: React.FC<BibleProviderProps> = ({ children }) => {
  const [availableBibleTranslations, setAvailableBibleTranslations] = useState<Translation[]>([]);
  const [currentBibleTranslation, setCurrentBibleTranslation] = useState<Translation | null>(null);
  const [selectedBookName, setSelectedBookName] = useState<string>('Genesis');
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(1);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);

  useEffect(() => {
    const loadInitialTranslations = async () => {
      try {
        const translations = await BibleDataService.getAllTranslations();
        setAvailableBibleTranslations(translations);
        
        if (translations.length > 0) {
          const defaultTranslation = translations.find(t => t.name.toUpperCase() === 'ESV') || translations[0];
          await changeTranslation(defaultTranslation.id);
        } else {
          console.error('No translations found');
          setCurrentBibleTranslation({
            id: 'error',
            name: 'Error',
            data: {},
            isLocal: false,
          });
        }
      } catch (error) {
        console.error('Failed to initialize translations:', error);
        setCurrentBibleTranslation({
          id: 'error',
          name: 'Error - Check Internet Connection',
          data: {},
          isLocal: false,
        });
      } finally {
        setIsInitializing(false);
      }
    };

    loadInitialTranslations();
  }, []);

  const translationNames = availableBibleTranslations.map(t => t.name);

  const changeTranslation = useCallback(async (translationId: string) => {
    const translationAbbreviation = translationId.toUpperCase();
    
    setIsLoadingTranslation(true);
    try {
      const result = await BibleDataService.fetchRemoteTranslation(translationAbbreviation);
      
      const newTranslation: Translation = {
        id: translationAbbreviation.toLowerCase(),
        name: translationAbbreviation, 
        data: result.data,
        isLocal: false,
      };
      
      setCurrentBibleTranslation(newTranslation);
      
      setAvailableBibleTranslations(prev => 
        prev.map(t => t.name.toUpperCase() === translationAbbreviation ? newTranslation : t)
      );
      
    } catch (error) {
      console.error(`Failed to load ${translationAbbreviation} translation:`, error);
      alert(`Failed to load ${translationAbbreviation} translation. Please check your internet connection and try again.`);
      throw error; 
    } finally {
      setIsLoadingTranslation(false);
    }
  }, []);

  const selectBook = useCallback((bookName: string) => {
    setSelectedBookName(bookName);
    setSelectedChapterNumber(1);
  }, []);

  const selectChapter = useCallback((chapterNumber: number) => {
    setSelectedChapterNumber(chapterNumber);
  }, []);

  const getCurrentChapterVerses = useCallback((): [string, string][] => {
    if (!currentBibleTranslation) return [];
    
    const selectedBookData = currentBibleTranslation.data[selectedBookName];
    if (!selectedBookData) return [];
    
    const selectedChapterData = selectedBookData[selectedChapterNumber.toString()];
    if (!selectedChapterData) return [];

    return Object.entries(selectedChapterData) as [string, string][];
  }, [currentBibleTranslation, selectedBookName, selectedChapterNumber]);

  if (isInitializing || !currentBibleTranslation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Bible...</Text>
      </View>
    );
  }

  return (
    <BibleContext.Provider
      value={{
        currentTranslation: currentBibleTranslation,
        availableTranslations: availableBibleTranslations,
        remoteTranslations: translationNames,
        selectedBook: selectedBookName,
        selectedChapter: selectedChapterNumber,
        setTranslation: changeTranslation,
        setBook: selectBook,
        setChapter: selectChapter,
        getCurrentVerses: getCurrentChapterVerses,
        isLoading: isInitializing,
        loadingRemoteTranslation: isLoadingTranslation,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
};

export const useBible = (): BibleContextType => {
  const context = useContext(BibleContext);
  if (!context) {
    throw new Error('useBible must be used within a BibleProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', 
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#ffffff', 
  },
});
