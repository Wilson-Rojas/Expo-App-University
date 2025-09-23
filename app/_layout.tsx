import { Stack } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(protected)/_layout" options={{ headerShown: false }} />
    </Stack>
  );
}
