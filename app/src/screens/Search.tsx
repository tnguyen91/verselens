import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useBible } from '../contexts/BibleContext';
import { BibleDataService } from '../services/BibleDataService';

interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  preview: string;
}

interface SearchProps {
  onVerseSelect: (book: string, chapter: number, verse: number) => void;
}

export const Search = React.memo<SearchProps>(({ onVerseSelect }) => {
  const { theme } = useTheme();
  const { currentTranslation } = useBible();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ot' | 'nt'>('all');

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    setTimeout(() => {
      const results = BibleDataService.searchBible(currentTranslation.data, query, selectedFilter);
      setSearchResults(results);
      setIsSearching(false);
    }, 100);
  }, [currentTranslation.data, selectedFilter]);

  useEffect(() => {
    performSearch(searchQuery.trim());
  }, [searchQuery, performSearch]);

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => {
    const handlePress = () => {
      onVerseSelect(item.book, item.chapter, item.verse);
    };

    const formatPreview = (preview: string) => {
      return preview.split('**').map((part, index) => {
        if (index % 2 === 1) {
          return (
            <Text key={index} style={[styles.highlight, { backgroundColor: theme.colors.highlight }]}>
              {part}
            </Text>
          );
        }
        return part;
      });
    };

    return (
      <TouchableOpacity
        style={[styles.resultItem, { borderBottomColor: theme.colors.border }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.reference, { color: theme.colors.accent }]}>
          {item.book} {item.chapter}:{item.verse}
        </Text>
        <Text style={[styles.preview, { color: theme.colors.textPrimary }]}>
          {formatPreview(item.preview)}
        </Text>
      </TouchableOpacity>
    );
  }, [theme.colors, onVerseSelect]);

  const renderFilterButton = useCallback((filter: 'all' | 'ot' | 'nt', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: selectedFilter === filter ? theme.colors.accent : theme.colors.tertiary,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterText,
          {
            color: selectedFilter === filter ? theme.colors.textPrimary : theme.colors.textMuted,
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  ), [selectedFilter, theme.colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.tertiary }]}>
          <Icon name="magnify" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search the Bible..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="close" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('ot', 'Old Testament')}
          {renderFilterButton('nt', 'New Testament')}
        </View>
      </View>

      <View style={styles.content}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
              Searching...
            </Text>
          </View>
        ) : searchResults.length > 0 ? (
          <>
            <Text style={[styles.resultCount, { color: theme.colors.textMuted }]}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item, index) => `${item.book}-${item.chapter}-${item.verse}-${index}`}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : searchQuery.trim().length >= 3 ? (
          <View style={styles.emptyContainer}>
            <Icon name="magnify" size={48} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No results found for "{searchQuery.trim()}"
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="book-search" size={48} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Enter at least 3 characters to search
            </Text>
            <Text style={[styles.helpText, { color: theme.colors.textDim }]}>
              Search for words, phrases, or verses across the entire Bible
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
});

Search.displayName = 'Search';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  resultCount: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  preview: {
    fontSize: 16,
    lineHeight: 22,
  },
  highlight: {
    fontWeight: 'bold',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
