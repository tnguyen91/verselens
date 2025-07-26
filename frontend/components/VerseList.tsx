import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { styles } from './styles';

type Props = {
  verses: [string, string][];
};

const VerseList: React.FC<Props> = ({ verses }) => {
  return (
    <FlatList
      ListHeaderComponent={<View style={{ height: 10 }} />}
      data={verses}
      keyExtractor={([verseNumber]) => verseNumber}
      renderItem={({ item: [number, text] }) => (
        <Text style={styles.verseText}>
          <Text style={styles.verseNumber}>{number}. </Text>
          {text}
        </Text>
      )}
      ListFooterComponent={<View style={{ height: 100 }} />}
    />
  );
};

export default VerseList;