import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DebugBar } from '@/components/DebugBar';
import { AuthProvider } from '@/context/auth';
import { onPushOpened, showPushesInForeground } from '@/lib/push';
import { loadThemePref } from '@/lib/theme-pref';
import { useTheme } from '@/hooks/use-theme';

/** A render error shows a readable message instead of a blank screen. */
export { ErrorBoundary } from '@/components/CrashScreen';

void loadThemePref();

export default function RootLayout() {
  const { isDark, bg } = useTheme();

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
          {/* An opaque floor, so a screen that draws nothing shows our colour, never the phone's window grey */}
          <View style={{ flex: 1, backgroundColor: bg }}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
            <Stack.Screen name="clinic" options={{ animation: 'none' }} />
            <Stack.Screen name="admin" options={{ animation: 'none' }} />
            <Stack.Screen name="doctor/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="add-doctor" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="visit/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="reschedule/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="rate/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
          </Stack>
          </View>
          <DebugBar />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
