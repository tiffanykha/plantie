import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, useFonts } from '@expo-google-fonts/outfit';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/useAuthStore';
import { usePlantStore } from '../src/store/usePlantStore';

export default function RootLayout() {
  const { session, isInitialized, initialize } = useAuthStore();
  const fetchPlants = usePlantStore((state) => state.fetchPlants);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    initialize().then((session) => {
      // Start fetching plants immediately once we know the session,
      // without waiting for a second render cycle.
      if (session) fetchPlants();
    });
  }, [initialize, fetchPlants]);

  useEffect(() => {
    if (!fontsLoaded || !isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, isInitialized, fontsLoaded, segments, router]);

  if (!fontsLoaded || !isInitialized) {
    return null; // Keep splash screen visible while fonts and auth load
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8F9FA' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="plant/[id]" />
        <Stack.Screen
          name="add-plant"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
