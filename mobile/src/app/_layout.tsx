import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '@/context/auth';
import { onPushOpened, showPushesInForeground } from '@/lib/push';
import { loadThemePref } from '@/lib/theme-pref';
import { useTheme } from '@/hooks/use-theme';

void loadThemePref();

export default function RootLayout() {
  const { isDark } = useTheme();

  // Tapping a push notification opens the screen it is about
  useEffect(() => {
    void showPushesInForeground();
    return onPushOpened((path) => router.push(path === '/visits' ? '/visits' : '/notifications'));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="doctor/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="add-doctor" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="visit/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
