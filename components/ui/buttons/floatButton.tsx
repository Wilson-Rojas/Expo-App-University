import { getTheme } from '@/components/core/theme';
import { useColorScheme as _useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";


const FloatingDownButton = ({ onPress }: { onPress?: () => void }) => {
  const colorScheme = _useColorScheme();
  const theme = getTheme(colorScheme);

return (
    <FAB
        icon="chevron-up" // ícono de flecha hacia arriba (usa MaterialCommunityIcons)
        style={[
            styles.fab,
            { backgroundColor: theme.colors.primary }, // círculo con color del tema
        ]}
        color="#fff" // color del icono
        onPress={onPress}
    />
);
};

const styles = StyleSheet.create({
  fab: {
    alignSelf: "center",
    borderRadius: 100, 
    width: 70,
    height: 70,
    justifyContent: "center",
  },
});

export default FloatingDownButton;
