import { DictionaryEntry } from '../types/bible';
import { DictionaryApiResponse } from '../types/services';

const DICTIONARY_API_BASE = 'https://verselens-dictionary-production.up.railway.app';

export class DictionaryService {
  static async fetchWordDefinition(word: string): Promise<DictionaryEntry> {
    try {
      const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
      const response = await fetch(`${DICTIONARY_API_BASE}/api/define/${cleanWord}`);
      
      if (!response.ok) {
        throw new Error(`Word not found: ${word}`);
      }
      
      const apiData: DictionaryApiResponse = await response.json();
      const entry: DictionaryEntry = {
        word: cleanWord,
        pronounciation: apiData.pronunciation?.phonetics?.map(p => ({
          text: p.text || '',
          audio: p.audio || ''
        })) || [],
        definitions: {}
      };

      if (apiData.definitions?.wordnet) {
        entry.definitions.wordnet = apiData.definitions.wordnet;
      }

      return entry;
    } catch (error) {
      console.error(`Error fetching definition for "${word}":`, error);
      throw error;
    }
  }
}
