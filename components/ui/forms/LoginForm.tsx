import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string; rememberMe: boolean }) => void;
  onCancel: () => void;
}

export default function LoginForm({ onSubmit, onCancel }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isDark = useColorScheme() === 'dark';

  const handleLogin = () => {
    onSubmit({ email, password, rememberMe });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: isDark ? '#20336d' : '#20336d' }]}>
          <Image 
            source={require('../../../assets/iu/logo_white.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.universityTitle}>Universidad Nexus</Text>
          <Text style={styles.universitySubTitle}>Bienvenido a tu espacio digital</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Campo Email */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                color: isDark ? '#FFFFFF' : '#000000'
              }]}
              placeholder="Email"
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Campo Password */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, { 
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                color: isDark ? '#FFFFFF' : '#000000'
              }]}
              placeholder="Password"
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={22} 
                color={isDark ? '#888' : '#999'} 
              />
            </TouchableOpacity>
          </View>

          {/* Remember me */}
          <View style={styles.rememberContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: "#D1D1D1", true: "#20336d" }}
              thumbColor={rememberMe ? "#FFFFFF" : "#F4F4F4"}
              ios_backgroundColor="#D1D1D1"
              style={styles.switch}
            />
            <Text style={[styles.rememberText, { color: isDark ? '#AAA' : '#666' }]}>
              Remember me
            </Text>
          </View>

          {/* Botón Login */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>

          {/* Botón Cancelar */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: isDark ? '#888' : '#666' }]}>
              Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    paddingVertical: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  universityTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  universitySubTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.7,
    alignContent:'center'
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '400',
  },
  passwordInput: {
    paddingRight: 55,
  },
  eyeIcon: {
    position: 'absolute',
    right: 20,
    top: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35,
    marginTop: 8,
  },
  switch: {
    marginRight: 12,
    transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }],
  },
  rememberText: {
    fontSize: 15,
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#20336d',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#20336d",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '400',
  },
});