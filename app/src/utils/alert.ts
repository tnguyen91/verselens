import { Platform, Alert as RNAlert } from 'react-native';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmMessage = message ? `${title}\n\n${message}` : title;
        const result = window.confirm(confirmMessage);
        
        if (result) {
          const actionButton = buttons.find(btn => btn.style !== 'cancel');
          actionButton?.onPress?.();
        } else {
          const cancelButton = buttons.find(btn => btn.style === 'cancel');
          cancelButton?.onPress?.();
        }
      } else {
        const alertMessage = message ? `${title}\n\n${message}` : title;
        window.alert(alertMessage);
        buttons?.[0]?.onPress?.();
      }
    } else {
      RNAlert.alert(title, message, buttons as any);
    }
  }
};
