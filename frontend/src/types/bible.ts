export interface BibleDataStructure {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
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

export interface BookListItemProps {
  item: string;
  onPress: (bookName: string) => void;
}

export interface VerseDisplayItemProps {
  verseNumber: string;
  verseText: string;
}
