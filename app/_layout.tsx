// app/_layout.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

const TOKEN_KEY = "@miapp:token";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        setIsLoggedIn(!!token); // true si hay token guardado
      } catch (e) {
        console.error("Error leyendo token", e);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inProtectedGroup = segments[0] === "(protected)";

    if (!isLoggedIn && inProtectedGroup) {
      router.replace("/login");
    } else if (isLoggedIn && !inProtectedGroup) {
      router.replace("/(protected)/(tabs)/explore"); // tu pantalla inicial protegida
    }
  }, [isLoggedIn, loading, segments, router]);

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <SafeAreaView
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <ActivityIndicator size="large" color="#007AFF" />
          </SafeAreaView>
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* siempre accesible */}
          <Stack.Screen name="login" />
          {/* grupo protegido */}
          <Stack.Screen name="(protected)" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
