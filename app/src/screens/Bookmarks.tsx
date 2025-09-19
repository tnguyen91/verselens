import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { Bookmark } from '../types/bible';
import { BookmarksProps } from '../types/components';
import { Alert } from '../utils/alert';

export const Bookmarks = React.memo<BookmarksProps>(({
  bookmarks,
  onVerseSelect,
  onDeleteBookmark,
  onAddNote,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    
    return bookmarks.filter(bookmark => 
      bookmark.book.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.note?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookmarks, searchQuery]);

  const handleDeleteBookmark = useCallback((bookmark: Bookmark) => {
    Alert.alert(
      'Delete Bookmark',
      `Remove bookmark for ${bookmark.book} ${bookmark.chapter}:${bookmark.verse}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteBookmark(bookmark.id)
        },
      ]
    );
  }, [onDeleteBookmark]);

  const handleEditNote = useCallback((bookmark: Bookmark) => {
    setEditingNote(bookmark.id);
    setNoteText(bookmark.note || '');
  }, []);

  const handleSaveNote = useCallback(() => {
    if (editingNote) {
      onAddNote(editingNote, noteText);
      setEditingNote(null);
      setNoteText('');
    }
  }, [editingNote, noteText, onAddNote]);

  const handleCancelEdit = useCallback(() => {
    setEditingNote(null);
    setNoteText('');
  }, []);

  const renderBookmark = useCallback(({ item }: { item: Bookmark }) => {
    const isEditing = editingNote === item.id;

    return (
      <View style={[styles.bookmarkItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.bookmarkContent}
          onPress={() => onVerseSelect(item.book, item.chapter, item.verse)}
          activeOpacity={0.7}
        >
          <Text style={[styles.reference, { color: theme.colors.accent }]}>
            {item.book} {item.chapter}:{item.verse}
          </Text>
          <Text style={[styles.verseText, { color: theme.colors.textPrimary }]}>
            {item.text}
          </Text>
          
          {item.note && !isEditing && (
            <View style={[styles.noteContainer, { backgroundColor: theme.colors.tertiary }]}>
              <Icon name="note-text" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                {item.note}
              </Text>
            </View>
          )}

          {isEditing && (
            <View style={styles.editContainer}>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: theme.colors.tertiary,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  }
                ]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add a note..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                maxLength={500}
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.colors.success }]}
                  onPress={handleSaveNote}
                >
                  <Icon name="check" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.colors.error }]}
                  onPress={handleCancelEdit}
                >
                  <Icon name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.date, { color: theme.colors.textDim }]}>
            Added {item.createdAt.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditNote(item)}
          >
            <Icon name="note-edit" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteBookmark(item)}
          >
            <Icon name="delete" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [theme.colors, editingNote, noteText, onVerseSelect, handleEditNote, handleDeleteBookmark, handleSaveNote, handleCancelEdit]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Bookmarks
        </Text>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.tertiary }]}>
          <Icon name="magnify" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search bookmarks..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="close" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {filteredBookmarks.length > 0 ? (
          <>
            <Text style={[styles.count, { color: theme.colors.textMuted }]}>
              {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
            </Text>
            <FlatList
              data={filteredBookmarks}
              renderItem={renderBookmark}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          </>
        ) : bookmarks.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="magnify" size={48} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No bookmarks match your search
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="bookmark-outline" size={48} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No bookmarks yet
            </Text>
            <Text style={[styles.helpText, { color: theme.colors.textDim }]}>
              Long press on any verse while reading to bookmark it
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
});

Bookmarks.displayName = 'Bookmarks';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
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
  content: {
    flex: 1,
    padding: 16,
  },
  count: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  bookmarkItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bookmarkContent: {
    padding: 16,
  },
  reference: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  editContainer: {
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
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
