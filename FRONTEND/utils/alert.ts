import { Alert, Platform } from 'react-native';

declare const window: any;

interface AlertButton {
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
    cancelable?: boolean;
    onDismiss?: () => void;
}

/**
 * Cross-platform alert that works on mobile and web
 * On web, uses window.alert/confirm for simple alerts
 * On mobile, uses React Native's Alert.alert
 */
export function showAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
): void {
    if (Platform.OS === 'web') {
        // Web fallback using window.alert/confirm
        if (typeof window !== 'undefined') {
            const fullMessage = message ? `${title}\n\n${message}` : title;

            if (!buttons || buttons.length === 0 || buttons.length === 1) {
                // Simple alert with OK button
                window.alert(fullMessage);
                if (buttons?.[0]?.onPress) {
                    buttons[0].onPress();
                }
            } else if (buttons.length === 2) {
                // Confirm dialog for 2 buttons (usually Cancel/OK)
                const cancelButton = buttons.find(b => b.style === 'cancel') || buttons[0];
                const confirmButton = buttons.find(b => b.style !== 'cancel') || buttons[1];

                const confirmed = window.confirm(fullMessage);
                if (confirmed) {
                    confirmButton.onPress?.();
                } else {
                    cancelButton.onPress?.();
                }
            } else {
                // For more than 2 buttons, show a simple alert and call the first button's callback
                window.alert(fullMessage);
                buttons[0]?.onPress?.();
            }
        }
    } else {
        // Mobile - use native Alert
        Alert.alert(title, message, buttons, options);
    }
}

/**
 * Simple success alert
 */
export function showSuccess(title: string, message?: string, onOk?: () => void): void {
    showAlert(title, message, [{ text: 'OK', onPress: onOk }]);
}

/**
 * Simple error alert
 */
export function showError(title: string, message?: string, onOk?: () => void): void {
    showAlert(title, message, [{ text: 'OK', onPress: onOk }]);
}

/**
 * Confirmation dialog
 */
export function showConfirm(
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
): void {
    showAlert(
        title,
        message,
        [
            { text: 'Cancel', style: 'cancel', onPress: onCancel },
            { text: 'OK', onPress: onConfirm }
        ]
    );
}

export default {
    alert: showAlert,
    success: showSuccess,
    error: showError,
    confirm: showConfirm
};
