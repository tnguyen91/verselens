import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BibleDataService, Translation } from '../services/BibleDataService';

interface BibleContextType {
  currentTranslation: Translation;
  availableTranslations: Translation[];
  remoteTranslations: string[];
  selectedBook: string;
  selectedChapter: number;
  setTranslation: (translationId: string) => Promise<void>;
  setBook: (book: string) => void;
  setChapter: (chapter: number) => void;
  getCurrentVerses: () => [string, string][];
  isLoading: boolean;
  loadingRemoteTranslation: boolean;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

interface BibleProviderProps {
  children: ReactNode;
}

export const BibleProvider: React.FC<BibleProviderProps> = ({ children }) => {
  const [availableTranslations, setAvailableTranslations] = useState<Translation[]>([]);
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [selectedBook, setSelectedBook] = useState<string>('Genesis');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingRemoteTranslation, setLoadingRemoteTranslation] = useState(false);

  useEffect(() => {
    const initializeTranslations = async () => {
      try {
        const translations = await BibleDataService.getAllTranslations();
        setAvailableTranslations(translations);
        
        if (translations.length > 0) {
          const defaultTranslation = translations.find(t => t.name.toUpperCase() === 'ESV') || translations[0];
          await setTranslation(defaultTranslation.id);
        } else {
          console.error('No translations found');
          setCurrentTranslation({
            id: 'error',
            name: 'Error',
            data: {},
            isLocal: false,
          });
        }
      } catch (error) {
        console.error('Failed to initialize translations:', error);
        setCurrentTranslation({
          id: 'error',
          name: 'Error - Check Internet Connection',
          data: {},
          isLocal: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeTranslations();
  }, []);

  const remoteTranslations = availableTranslations.map(t => t.name);

  const setTranslation = useCallback(async (translationId: string) => {
    const translationAbbr = translationId.toUpperCase();
    
    setLoadingRemoteTranslation(true);
    try {
      const result = await BibleDataService.fetchRemoteTranslation(translationAbbr);
      
      const remoteTranslation: Translation = {
        id: translationAbbr.toLowerCase(),
        name: translationAbbr, 
        data: result.data,
        isLocal: false,
      };
      
      setCurrentTranslation(remoteTranslation);
      
      setAvailableTranslations(prev => 
        prev.map(t => t.name.toUpperCase() === translationAbbr ? remoteTranslation : t)
      );
      
    } catch (error) {
      console.error(`Failed to load ${translationAbbr} translation:`, error);
      alert(`Failed to load ${translationAbbr} translation. Please check your internet connection and try again.`);
      throw error; 
    } finally {
      setLoadingRemoteTranslation(false);
    }
  }, []);

  const setBook = useCallback((book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
  }, []);

  const setChapter = useCallback((chapter: number) => {
    setSelectedChapter(chapter);
  }, []);

  const getCurrentVerses = useCallback((): [string, string][] => {
    if (!currentTranslation) return [];
    
    const bookData = currentTranslation.data[selectedBook];
    if (!bookData) return [];
    
    const chapterData = bookData[selectedChapter.toString()];
    if (!chapterData) return [];

    return Object.entries(chapterData) as [string, string][];
  }, [currentTranslation, selectedBook, selectedChapter]);

  if (isLoading || !currentTranslation) {
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
        currentTranslation,
        availableTranslations,
        remoteTranslations,
        selectedBook,
        selectedChapter,
        setTranslation,
        setBook,
        setChapter,
        getCurrentVerses,
        isLoading,
        loadingRemoteTranslation,
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
