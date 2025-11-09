import { getTheme } from "@/components/core/theme";
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from "react";
import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";

type FloatingDownButtonProps = {
  onPress: () => void;
  title?: string; // 👈 opcional
  icon?: string;  // 👈 opcional (MaterialCommunityIcons)
};
export default function FloatingDownButton({
  onPress,
  title,
  icon = "chevron-up", // 👈 valor por defecto
}: FloatingDownButtonProps) {
  const theme = getTheme(useColorScheme());

  return (
    <FAB
      label={title} 
      icon={icon}
      style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      color="#fff"
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "relative",
    alignSelf: "center",
    margin: 16,
    borderRadius: 50,
  },
});
 