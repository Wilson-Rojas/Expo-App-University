// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [isLoggedIn, setIsLoggedIn] = useState(false); // estado simulado
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Simulación de verificar si hay sesión (ej: AsyncStorage, API, etc)
  useEffect(() => {
    const checkLogin = async () => {
      // Aquí iría tu lógica real de autenticación
      // por ejemplo: revisar un token guardado en AsyncStorage
      await new Promise((res) => setTimeout(res, 500)); // simular delay
      setIsLoggedIn(false); // cambia a true si hay login
      setLoading(false);
    };
    checkLogin();
  }, []);

  // Control de navegación según login
  useEffect(() => {
    if (loading) return;

    const inProtectedGroup = segments[0] === "(protected)";

    if (!isLoggedIn && inProtectedGroup) {
      router.replace("/login");
    } else if (isLoggedIn && !inProtectedGroup) {
      router.replace("/(protected)/(tabs)/explore");
    }
  }, [isLoggedIn, loading, segments]);

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
            <ActivityIndicator size="large" color="#007AFF" />
          </SafeAreaView>
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* login estará disponible siempre */}
          <Stack.Screen name="login" />
          {/* el grupo protegido estará dentro de (protected) */}
          <Stack.Screen name="(protected)" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}