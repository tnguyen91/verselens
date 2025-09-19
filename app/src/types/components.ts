import { ModalListItem } from './bible';

export interface TranslationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export interface BookSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  modalData: ModalListItem[];
  expandedBook: string | null;
  onBookToggle: (bookName: string) => void;
  onChapterSelect: (bookName: string, chapter: number) => void;
  currentBook: string;
  currentChapter: number;
  setExpandedBook: (bookName: string | null) => void;
}

export interface WordDefinitionModalProps {
  isVisible: boolean;
  word: string | null;
  onClose: () => void;
}

export interface BibleNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
}

export type TabKey = 'bible' | 'search' | 'bookmarks' | 'settings';

export interface TabNavigatorProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export interface BibleVerseProps {
  verseNumber: string;
  verseText: string;
  isBookmarked: boolean;
  onBookmarkToggle: (verse: number, text: string) => void;
}

export interface BibleHeaderProps {
}

export interface BookmarksProps {
  bookmarks: import('./bible').Bookmark[];
  onVerseSelect: (book: string, chapter: number, verse: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onAddNote: (bookmarkId: string, note: string) => void;
}

export interface SearchProps {
  onVerseSelect: (book: string, chapter: number, verse: number) => void;
}