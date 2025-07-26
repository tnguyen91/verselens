import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import Modal from 'react-native-modal';
import { styles } from './styles';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  chapterList: number[];
  onSelectChapter: (chapter: number) => void;
};

const ChapterSelectorModal: React.FC<Props> = ({
  isVisible,
  onClose,
  chapterList,
  onSelectChapter,
}) => (
  <Modal isVisible={isVisible} onSwipeComplete={onClose} swipeDirection="down" style={styles.modal} propagateSwipe={true}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Chapters</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.modalClose}>✕</Text>
        </Pressable>
      </View>
      <FlatList
        data={chapterList}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item }) => (
          <Pressable style={styles.modalItem} onPress={() => onSelectChapter(item)}>
            <Text style={styles.modalItemText}>Ch. {item}</Text>
          </Pressable>
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  </Modal>
);

export default ChapterSelectorModal;