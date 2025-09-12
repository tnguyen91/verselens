import { DictionaryEntry } from '../types/bible';

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export class DictionaryService {
  static async fetchWordDefinition(word: string): Promise<DictionaryEntry[]> {
    try {
      const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
      const response = await fetch(`${DICTIONARY_API_BASE}/${cleanWord}`);
      
      if (!response.ok) {
        throw new Error(`Word not found: ${word}`);
      }
      
      const data: DictionaryEntry[] = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching definition for "${word}":`, error);
      throw error;
    }
  }
}
