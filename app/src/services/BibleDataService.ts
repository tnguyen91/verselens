import { BibleDataStructure, BibleTranslation, CurrentReference, TranslationInfo } from '../types/bible';

const BIBLE_API_BASE = 'https://raw.githubusercontent.com/jadenzaleski/BibleTranslations/master';

const remoteTranslationCache = new Map<string, BibleTranslation>();
let availableTranslationsCache: TranslationInfo[] | null = null;

export interface Translation {
  id: string;
  name: string;
  data: BibleDataStructure;
  isLocal: boolean;
}

export class BibleDataService {
  static async fetchAvailableTranslations(): Promise<TranslationInfo[]> {
    if (availableTranslationsCache) {
      return availableTranslationsCache;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('https://api.github.com/repos/jadenzaleski/BibleTranslations/contents', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`GitHub API failed: ${response.status}`);
      }
      
      const contents = await response.json();
      
      const translationFolders = contents
        .filter((item: any) => item.type === 'dir')
        .map((item: any) => ({
          name: item.name 
        }));
      
      availableTranslationsCache = translationFolders;
      return translationFolders;
      
    } catch (error) {
      console.error('Failed to fetch translations from GitHub API:', error);
      throw new Error('Unable to load Bible translations. Please check your internet connection.');
    }
  }

  static async getAllTranslations(): Promise<Translation[]> {
    const translationInfos = await BibleDataService.fetchAvailableTranslations();
    
    return translationInfos.map(info => ({
      id: info.name.toLowerCase(),
      name: info.name,
      data: {},
      isLocal: false,
    }));
  }

  static async fetchRemoteTranslation(translation: string): Promise<{ data: BibleTranslation }> {
    if (remoteTranslationCache.has(translation)) {
      return { data: remoteTranslationCache.get(translation)! };
    }

    const apiUrl = `${BIBLE_API_BASE}/${translation}/${translation}_bible.json`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); 
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - Failed to fetch ${translation}`);
    }
    
    const data: BibleTranslation = await response.json();
    
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error(`Invalid Bible data received for ${translation}`);
    }
    
    remoteTranslationCache.set(translation, data);
    
    return { data };
  }

  static getNextChapter(book: string, chapter: number, bibleData?: BibleTranslation): { book: string; chapter: number } | null {
    if (!bibleData) return null;
    
    const books = Object.keys(bibleData);
    const currentBookIndex = books.indexOf(book);
    if (currentBookIndex === -1) return null;

    const bookChapters = Object.keys(bibleData[book] || {}).map(ch => parseInt(ch)).sort((a, b) => a - b);
    const maxChapter = Math.max(...bookChapters);
    
    if (chapter < maxChapter) {
      return { book, chapter: chapter + 1 };
    }

    if (currentBookIndex < books.length - 1) {
      return { book: books[currentBookIndex + 1], chapter: 1 };
    }

    return null;
  }

  static getPreviousChapter(book: string, chapter: number, bibleData?: BibleTranslation): { book: string; chapter: number } | null {
    if (!bibleData) return null;
    
    const books = Object.keys(bibleData);
    const currentBookIndex = books.indexOf(book);
    if (currentBookIndex === -1) return null;

    if (chapter > 1) {
      return { book, chapter: chapter - 1 };
    }

    if (currentBookIndex > 0) {
      const previousBook = books[currentBookIndex - 1];
      const previousBookChapters = Object.keys(bibleData[previousBook] || {}).map(ch => parseInt(ch)).sort((a, b) => a - b);
      const maxChapter = Math.max(...previousBookChapters);
      return { book: previousBook, chapter: maxChapter };
    }

    return null;
  }

  static canNavigatePrevious(currentReference: CurrentReference): boolean {
    return this.getPreviousChapter(currentReference.book, currentReference.chapter, currentReference.bibleData) !== null;
  }

  static canNavigateNext(currentReference: CurrentReference): boolean {
    return this.getNextChapter(currentReference.book, currentReference.chapter, currentReference.bibleData) !== null;
  }

  static searchBible(bible: BibleDataStructure, query: string, filter: 'all' | 'ot' | 'nt' = 'all'): Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
    preview: string;
  }> {
    if (!query || query.length < 3) return [];

    const results: Array<{
      book: string;
      chapter: number;
      verse: number;
      text: string;
      preview: string;
    }> = [];
    
    const queryLower = query.toLowerCase();
    
    const allBooks = Object.keys(bible);
    
    const matthewIndex = allBooks.findIndex(book => book.toLowerCase().includes('matthew'));
    const oldTestamentBooks = matthewIndex >= 0 ? allBooks.slice(0, matthewIndex) : allBooks.slice(0, Math.floor(allBooks.length * 0.75));

    allBooks.forEach(book => {
      if (filter === 'ot' && !oldTestamentBooks.includes(book)) return;
      if (filter === 'nt' && oldTestamentBooks.includes(book)) return;

      Object.keys(bible[book]).forEach(chapterStr => {
        const chapter = parseInt(chapterStr);
        Object.keys(bible[book][chapterStr]).forEach(verseStr => {
          const verse = parseInt(verseStr);
          const text = bible[book][chapterStr][verseStr];
          
          if (text.toLowerCase().includes(queryLower)) {
            const highlightedText = text.replace(
              new RegExp(query, 'gi'),
              `**$&**`
            );
            
            results.push({
              book,
              chapter,
              verse,
              text,
              preview: highlightedText.length > 150 
                ? highlightedText.substring(0, 150) + '...' 
                : highlightedText
            });
          }
        });
      });
    });

    return results.slice(0, 100);
  }
}