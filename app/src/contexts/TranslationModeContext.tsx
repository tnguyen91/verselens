import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TranslationModeContextType {
  translationMode: boolean;
  setTranslationMode: (enabled: boolean) => void;
  toggleTranslationMode: () => void;
}

const TranslationModeContext = createContext<TranslationModeContextType | undefined>(undefined);

interface TranslationModeProviderProps {
  children: ReactNode;
}

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
