import { BibleDataStructure } from './bible';

export interface Translation {
  id: string;
  name: string;
  data: BibleDataStructure;
  isLocal: boolean;
}

export interface BibleDataServiceTypes {
  getNextChapter: (book: string, chapter: number, data: any) => { book: string; chapter: number } | null;
  getPreviousChapter: (book: string, chapter: number, data: any) => { book: string; chapter: number } | null;
}

export interface DictionaryApiResponse {
  word: string;
  pronunciation?: {
    phonetics: Array<{
      text?: string;
      audio?: string;
    }>;
  };
  definitions?: {
    wordnet?: string[];
  };
}

export interface DictionaryServiceTypes {
  fetchWordDefinition: (word: string) => Promise<import('./bible').DictionaryEntry>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export interface StorageData {
  bookmarks: import('./bible').Bookmark[];
  settings: {
    fontSize: number;
    keepScreenOn: boolean;
  };
  metadata: {
    exportedAt: string;
    version: string;
    bookmarkCount: number;
    deviceInfo: {
      platform: string;
      timestamp: number;
    };
  };
}