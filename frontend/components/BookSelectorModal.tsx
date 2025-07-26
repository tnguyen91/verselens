import React from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import Modal from 'react-native-modal';
import { styles } from './styles';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  filteredBooks: string[];
  onSelectBook: (book: string) => void;
};

const BookSelectorModal: React.FC<Props> = ({
  isVisible,
  onClose,
  searchText,
  onSearchChange,
  filteredBooks,
  onSelectBook,
}) => {
  return (
    <Modal isVisible={isVisible} onSwipeComplete={onClose} swipeDirection="down" style={styles.modal} propagateSwipe={true}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search book"
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={onSearchChange}
          />
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </Pressable>
        </View>
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable style={styles.modalItem} onPress={() => onSelectBook(item)}>
              <Text style={styles.modalItemText}>{item}</Text>
            </Pressable>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>
    </Modal>
  );
};

export default BookSelectorModal;
