export interface BibleDataStructure {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
}

export interface BibleTranslation extends BibleDataStructure {}

export interface Bookmark {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note?: string;
  createdAt: Date;
}

export interface BookModalListItem {
  type: 'book';
  bookName: string;
}

export interface ChapterModalListItem {
  type: 'chapter';
  bookName: string;
  chapterNumber: number;
}

export type ModalListItem = BookModalListItem | ChapterModalListItem;

export interface CurrentReference {
  book: string;
  chapter: number;
  translation: string;
  bibleData?: BibleDataStructure; 
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryPhonetic {
  text: string;
  audio?: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

export interface DictionaryEntry {
  word: string;  
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
}

export interface TranslationInfo {
  name: string;
}

export interface BookInfo {
  name: string;
  chapters: number[];
}

export const getBibleBooks = (bibleData: BibleDataStructure): BookInfo[] => {
  return Object.keys(bibleData).map(bookName => ({
    name: bookName,
    chapters: Object.keys(bibleData[bookName] || {}).map(ch => parseInt(ch)).sort((a, b) => a - b)
  }));
};
