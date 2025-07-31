import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useBible } from '../contexts/BibleContext';

interface TranslationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TranslationModal = React.memo<TranslationModalProps>(({
  isVisible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { 
    currentTranslation, 
    availableTranslations, 
    setTranslation, 
    loadingRemoteTranslation 
  } = useBible();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTranslations = useMemo(() => 
    availableTranslations.filter(translation =>
      translation.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [availableTranslations, searchQuery]
  );

  const handleTranslationSelect = useCallback(async (translationId: string) => {
    await setTranslation(translationId);
    onClose();
  }, [setTranslation, onClose]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
      backdropOpacity={0.5}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={300}
      avoidKeyboard={false}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        {/* Header */}
                <View style={[styles.modalHeader, { backgroundColor: theme.colors.secondary, borderBottomColor: theme.colors.border }]}>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.tertiary }]}>
            <Icon name="magnify" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
            <TextInput
                style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                placeholder="Search translations..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Icon name="close" size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
            )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCloseButton, { 
                backgroundColor: theme.colors.tertiary,
                borderWidth: 1,
                borderColor: theme.colors.border
              }]}
            >
              <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.content}>
        {/* Loading indicator */}
        {loadingRemoteTranslation && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
              Loading translation...
            </Text>
          </View>
        )}

        {/* Translations List */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredTranslations.map((translation) => {
            const isSelected = currentTranslation.name === translation.name;
            
            return (
              <TouchableOpacity
                key={translation.id}
                style={[
                  styles.translationItem,
                  { borderBottomColor: theme.colors.border },
                  isSelected && [styles.selectedTranslationItem, { 
                    backgroundColor: theme.colors.highlight,
                    borderLeftColor: theme.colors.accent 
                  }]
                ]}
                onPress={() => handleTranslationSelect(translation.id)}
                disabled={loadingRemoteTranslation}
              >
                <View style={styles.translationInfo}>
                  <View style={styles.translationHeader}>
                    <Text style={[
                      styles.translationAbbr,
                      { color: theme.colors.textPrimary }
                    ]}>
                      {translation.name}
                    </Text>
                    <View style={styles.badges}>
                      {isSelected && (
                        <Icon name="check" size={16} color={theme.colors.accent} />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredTranslations.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="book-search" size={48} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No translations found
            </Text>
          </View>
        )}
        </View>
      </View>
    </Modal>
  );
});

TranslationModal.displayName = 'TranslationModal';

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    margin: 0,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  translationItem: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  selectedTranslationItem: {
    borderLeftWidth: 3,
  },
  translationInfo: {
    flex: 1,
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  translationAbbr: {
    fontSize: 18,
    fontWeight: "600",
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32 + 20,
    gap: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
