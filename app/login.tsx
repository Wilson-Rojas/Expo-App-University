import LoginForm from '@/components/ui/forms/LoginForm';
import { useColorScheme } from '@/hooks/use-color-scheme';
import BottomSheet from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef } from "react";
import { View, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuths';

export default function Login() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const colorScheme = useColorScheme();
  const snapPoints = useMemo(() => ["25%", "85%"], []);

  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <LoginContent
            onOpen={handleOpen}
            onClose={handleClose}
            bottomSheetRef={bottomSheetRef}
            snapPoints={snapPoints}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

interface LoginContentProps {
  onOpen: () => void;
  onClose: () => void;
  bottomSheetRef: React.RefObject<any>;
  snapPoints: string[] | number[];
}

function LoginContent({ onOpen, onClose }: LoginContentProps) {
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (data: { email: string; password: string; rememberMe: boolean }) => {
    const res = await login(data.email, data.password);
    if (res.success) {
      // navigate to protected tabs index (root of the tabs group)
      router.replace("/(protected)/(tabs)");
      onClose();
    } else {
      Alert.alert('Login failed', res.error || 'Error desconocido');
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <LoginForm
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </View>
  );
}
