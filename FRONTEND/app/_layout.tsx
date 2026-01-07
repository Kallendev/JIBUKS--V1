import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';

export const unstable_settings = {
  initialRouteName: 'slideshow',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="slideshow" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="account-type" options={{ headerShown: false }} />
          <Stack.Screen name="family-setup" options={{ headerShown: false }} />
          <Stack.Screen name="add-family-member" options={{ headerShown: false }} />
          <Stack.Screen name="invite-success" options={{ headerShown: false }} />
          <Stack.Screen name="income-sources" options={{ headerShown: false }} />
          <Stack.Screen name="spending-categories" options={{ headerShown: false }} />
          <Stack.Screen name="monthly-budgets" options={{ headerShown: false }} />
          <Stack.Screen name="family-dreams" options={{ headerShown: false }} />
          <Stack.Screen name="goal-success" options={{ headerShown: false }} />
          <Stack.Screen name="connect-mobile-money" options={{ headerShown: false }} />
          <Stack.Screen name="business-onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="contact-information" options={{ headerShown: false }} />
          <Stack.Screen name="financial-setup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
