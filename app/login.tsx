import FloatingDownButton from "@/components/ui/buttons/floatButton";
import { useColorScheme } from '@/hooks/use-color-scheme';
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, ThemeProvider, useTheme } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef } from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginForm from "../components/ui/forms/LoginForm";

export default function Login() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const colorScheme = useColorScheme();
  const snapPoints = useMemo(() => ["25%", "70%"], []);

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
          <LoginContent onOpen={handleOpen} onClose={handleClose} bottomSheetRef={bottomSheetRef} snapPoints={snapPoints} />
        </SafeAreaView>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

function LoginContent({ onOpen, onClose, bottomSheetRef, snapPoints }) {
  const { colors } = useTheme(); // 👈 obtiene colores del theme

  return (
    <ImageBackground
      source={require("@/assets/iu/bg_login.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <FloatingDownButton onPress={onOpen} />
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={[
          styles.bottomSheetBackground,
          { backgroundColor: colors.card }, // 👈 dinámico
        ]}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          <LoginForm
            onSubmit={(data) => {
              console.log("Datos de login:", data);
              onClose();
            }}
            onCancel={onClose}
          />
        </BottomSheetView>
      </BottomSheet>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
  },
  bottomSheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
