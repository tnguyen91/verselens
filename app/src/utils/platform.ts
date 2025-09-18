import { Platform, Dimensions, StyleSheet } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const platformSelect = Platform.select;

export const getScreenDimensions = () => Dimensions.get('window');
export const isSmallScreen = () => getScreenDimensions().width < 768;
export const isLandscape = () => getScreenDimensions().width > getScreenDimensions().height;

export const platformStyles = StyleSheet.create({
  statusBarPadding: platformSelect({
    web: { paddingTop: 10 },
    ios: { paddingTop: 20 },
    android: { paddingTop: 16 },
    default: { paddingTop: 16 }
  }),

  shadow: platformSelect({
    web: {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    ios: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    default: {}
  }),

  borderRadius: platformSelect({
    web: { borderRadius: 8 },
    ios: { borderRadius: 8 },
    android: { borderRadius: 4 },
    default: { borderRadius: 8 }
  }),

  fontSize: platformSelect({
    web: { fontSize: 16 },
    ios: { fontSize: 16 },
    android: { fontSize: 14 },
    default: { fontSize: 16 }
  })
});

export const PlatformWrapper = platformSelect({
  web: require('react-native').View,
  default: require('react-native-gesture-handler').GestureHandlerRootView
});

export const supportsWebAudio = () => isWeb && typeof window !== 'undefined' && 'Audio' in window;
export const supportsNativeAudio = () => !isWeb;
export const supportsFileSystem = () => !isWeb;
export const supportsWebFileAPI = () => isWeb && typeof window !== 'undefined' && 'Blob' in window;

export const platformCapabilities = {
  supportsAudioRecording: !isWeb,
  supportsFileSharing: !isWeb,
  supportsBackgroundAudio: !isWeb,
  supportsWebDownload: isWeb,
  supportsNativeNavigation: !isWeb,
  supportsWebClipboard: isWeb,
} as const;