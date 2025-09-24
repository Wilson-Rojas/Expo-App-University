import { ColorSchemeName } from "react-native";
import { DefaultTheme, MD3DarkTheme } from "react-native-paper";
const baseColors = {
    primary: '#3498db',    
    accent: '#f1c40f',      
    secondary: '#2ecc71',   
    error: '#e74c3c',
};

const lightTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        ...baseColors,
        background: '#ecf0f1',  
        surface: '#ffffff',    
        text: '#2c3e50',        
        backgroundLight: '#ffffff',
        backgroundDark: '#34495e', 
    }
};

const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        ...baseColors,
        background: '#2c3e50',
        surface: '#34495e',
        text: '#ecf0f1',
        backgroundLight: '#34495e',
        backgroundDark: '#1a252f',
    }
};

export const getTheme = (colorScheme: ColorSchemeName) => {
  const scheme = colorScheme ?? "light"; // fallback a light
  return scheme === "dark" ? darkTheme : lightTheme;
};


// Para mantener compatibilidad
export default lightTheme;