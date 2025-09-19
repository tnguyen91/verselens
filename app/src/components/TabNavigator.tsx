import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { TabKey, TabNavigatorProps } from '../types/components';

interface Tab {
  key: TabKey;
  title: string;
  icon: string;
}

const tabs: Tab[] = [
  { key: 'bible', title: 'Bible', icon: 'book-cross' },
  { key: 'search', title: 'Search', icon: 'magnify' },
  { key: 'bookmarks', title: 'Bookmarks', icon: 'bookmark' },
  { key: 'settings', title: 'Settings', icon: 'cog' },
];

export const TabNavigator = React.memo<TabNavigatorProps>(({ activeTab, onTabPress }) => {
  const { theme } = useTheme();

  const memoizedTabs = useMemo(() => tabs, []);

  const handleTabPress = useCallback((tab: TabKey) => {
    onTabPress(tab);
  }, [onTabPress]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.tabBar, { borderTopColor: theme.colors.border }]}>
        {memoizedTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={activeTab === tab.key ? theme.colors.accent : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabTitle,
                {
                  color: activeTab === tab.key ? theme.colors.accent : theme.colors.textMuted,
                },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
});

TabNavigator.displayName = 'TabNavigator';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabTitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});
