import React, { createContext, useContext, useState, useCallback } from 'react';
import { TranslationModeContextType, TranslationModeProviderProps } from '../types/contexts';

const TranslationModeContext = createContext<TranslationModeContextType | undefined>(undefined);

export const TranslationModeProvider: React.FC<TranslationModeProviderProps> = ({ children }) => {
  const [translationMode, setTranslationMode] = useState(false);

  const toggleTranslationMode = useCallback(() => {
    setTranslationMode(prev => !prev);
  }, []);

  const handleSetTranslationMode = useCallback((enabled: boolean) => {
    setTranslationMode(enabled);
  }, []);

  return (
    <TranslationModeContext.Provider 
      value={{
        translationMode,
        setTranslationMode: handleSetTranslationMode,
        toggleTranslationMode,
      }}
    >
      {children}
    </TranslationModeContext.Provider>
  );
};

export const useTranslationMode = (): TranslationModeContextType => {
  const context = useContext(TranslationModeContext);
  if (!context) {
    throw new Error('useTranslationMode must be used within a TranslationModeProvider');
  }
  return context;
};
