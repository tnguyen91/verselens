import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useUserData } from '../contexts/UserDataContext';
import { Alert } from '../utils/alert';

export const Settings = React.memo(() => {
  const { theme, setTheme } = useTheme();
  const { 
    exportToFile,
    importFromFile,
    clearAllData, 
    bookmarks, 
    fontSize, 
    setFontSize, 
    keepScreenOn, 
    setKeepScreenOn 
  } = useUserData();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportData = useCallback(async () => {
    try {
      setIsProcessing(true);
      await exportToFile();
      
      Alert.alert(
        'Data Exported',
        'Your bookmarks and settings have been exported as a JSON file. You can save this file to restore your data later.'
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [exportToFile]);

  const handleImportData = useCallback(async () => {
    try {
      setIsProcessing(true);
      await importFromFile();
      Alert.alert(
        'Data Imported',
        'Your bookmarks and settings have been restored successfully from the JSON file.'
      );
    } catch (error) {
      Alert.alert(
        'Import Failed', 
        'Could not import your data. Please check the file format and try again.'
      );
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [importFromFile]);

  const handleClearAllData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      `This will permanently delete all your bookmarks (${bookmarks.length}) and reset all settings. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await clearAllData();
              Alert.alert('Data Cleared', 'All your data has been cleared successfully.');
            } catch (error) {
              Alert.alert('Clear Failed', 'Could not clear your data. Please try again.');
              console.error('Clear error:', error);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [clearAllData, bookmarks.length]);

  const renderToggleOption = useCallback((
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={[styles.option, { backgroundColor: theme.colors.secondary }]}>
      <View style={styles.optionContent}>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>
            {description}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          thumbColor={value ? theme.colors.accent : theme.colors.textMuted}
          trackColor={{ 
            false: theme.colors.border, 
            true: theme.colors.accentLight 
          }}
        />
      </View>
    </View>
  ), [theme.colors]);

  const renderFontSizeControls = useCallback(() => (
    <View style={[styles.option, { backgroundColor: theme.colors.secondary }]}>
      <View style={styles.optionContent}>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
            Font Size
          </Text>
          <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>
            Adjust text size for comfortable reading
          </Text>
        </View>
        <View style={styles.fontSizeControls}>
          <TouchableOpacity
            style={[styles.fontButton, { backgroundColor: theme.colors.accent }]}
            onPress={() => setFontSize(Math.max(12, fontSize - 2))}
          >
            <Icon name="minus" size={16} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.fontSizeText, { color: theme.colors.textPrimary }]}>
            {fontSize}
          </Text>
          <TouchableOpacity
            style={[styles.fontButton, { backgroundColor: theme.colors.accent }]}
            onPress={() => setFontSize(Math.min(32, fontSize + 2))}
          >
            <Icon name="plus" size={16} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [theme.colors, fontSize, setFontSize]);

  const renderStorageOption = useCallback((
    title: string,
    description: string,
    iconName: string,
    onPress: () => void,
    isDestructive = false
  ) => (
    <TouchableOpacity
      style={[
        styles.option,
        { 
          backgroundColor: theme.colors.secondary,
          opacity: isProcessing ? 0.6 : 1,
        }
      ]}
      onPress={onPress}
      disabled={isProcessing}
    >
      <View style={styles.optionContent}>
        <Icon 
          name={iconName} 
          size={24} 
          color={isDestructive ? theme.colors.error : theme.colors.accent} 
        />
        <View style={styles.optionText}>
          <Text style={[
            styles.optionTitle, 
            { color: isDestructive ? theme.colors.error : theme.colors.textPrimary }
          ]}>
            {title}
          </Text>
          <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [theme.colors, isProcessing]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Settings
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Appearance
          </Text>
          {renderToggleOption(
            'Dark Mode',
            'Switch between dark and light themes',
            theme.mode === 'dark',
            (value) => setTheme(value ? 'dark' : 'light')
          )}
          
          {renderFontSizeControls()}
        </View>

        {/* Reading Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Reading
          </Text>
          {renderToggleOption(
            'Keep Screen On',
            'Prevent screen from turning off while reading',
            keepScreenOn,
            setKeepScreenOn
          )}
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Data Management
          </Text>
          
          {renderStorageOption(
            'Export Data',
            `Export your ${bookmarks.length} bookmarks and settings to a JSON file`,
            'export',
            handleExportData
          )}
          
          {renderStorageOption(
            'Import Data',
            'Import bookmarks and settings from a JSON backup file',
            'import',
            handleImportData
          )}
          
          {renderStorageOption(
            'Clear All Data',
            'Delete all bookmarks and reset settings',
            'delete-forever',
            handleClearAllData,
            true
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
});

Settings.displayName = 'Settings';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  option: {
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
});
