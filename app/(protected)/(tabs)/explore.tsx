import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { API_URL } from '@/constants/api';
import { getToken, TOKEN_KEY } from '@/hooks/useAuths';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserProfile = {
  id: number;
  name: string;
  email: string;
  level?: number;
  role?: string;
  avatar_url?: string;
};

// Fetch current user profile from API
async function fetchUserProfile() {
  const token = await getToken();
  const url = `${API_URL}/api/user`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error obteniendo perfil');
  }

  const data = await res.json();
  return data.data || data;
}

// Logout function that notifies the API
async function logoutUser() {
  const token = await getToken();
  const url = `${API_URL}/api/auth/logout`;
  if (token) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Logout API response:', response.status);
    } catch (err) {
      console.error('Error notifying logout to API:', err);
    }
  }

  // Remove token from local storage - this MUST succeed
  try {
    console.log('Removing token from storage...');
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('Token removed successfully');
    
    // Verify token was actually removed
    const verifyToken = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('Token after removal:', verifyToken ? 'STILL EXISTS' : 'DELETED');
    
    if (verifyToken) {
      // If it still exists, try removing it again
      console.warn('Token still exists, attempting second removal...');
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Error removing token from storage:', err);
    throw err; // Re-throw to let caller know it failed
  }
}

function ProfileHeader({ user, isDark }: { user: UserProfile; isDark: boolean }) {
  // Extract first letter for avatar
  const getInitial = (name: string): string => {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  };

  // Get level label
  const getLevelLabel = (level?: number): string => {
    if (level === 1) return 'Supervisor';
    if (level === 2) return 'Estudiante';
    return '';
  };

  return (
    <View style={[styles.profileHeader, isDark && styles.profileHeaderDark]}>
      <View style={styles.avatarLarge}>
        <Text style={styles.avatarLargeText}>{getInitial(user.name)}</Text>
      </View>
      <Text style={[styles.profileName, isDark && styles.profileNameDark]}>
        {user.name}
      </Text>
      <Text style={[styles.profileLevel, isDark && styles.profileLevelDark]}>
        {getLevelLabel(user.level)}
      </Text>
      <Text style={[styles.profileEmail, isDark && styles.profileEmailDark]}>{user.email}</Text>
      {user.role && <Text style={[styles.profileRole, isDark && styles.profileRoleDark]}>{user.role}</Text>}
    </View>
  );
}

function ProfileSection(
  {
    title,
    children,
    isDark,
  }: {
    title: string;
    children: React.ReactNode;
    isDark: boolean;
  }
) {
  return (
    <View style={[styles.section, isDark && styles.sectionDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow(
  {
    label,
    value,
    onPress,
    isDark,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    isDark: boolean;
  }
) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, isDark && styles.settingRowDark]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>{label}</Text>
      {value && <Text style={[styles.settingValue, isDark && styles.settingValueDark]}>{value}</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchUserProfile();
        if (mounted) {
          setUser(profile);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar perfil');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const changePassword = async () => {
    // TODO: Navigate to password change screen or implement here
    console.log('Cambiar contraseña');
  };

  const updateNotifications = async () => {
    // TODO: Navigate to notification settings or implement here
    console.log('Actualizar notificaciones');
  };

  const updatePrivacy = async () => {
    // TODO: Navigate to privacy settings or implement here
    console.log('Actualizar privacidad');
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Cerrar sesión',
        onPress: async () => {
          try {
            console.log('Starting logout process...');
            setLoading(true);
            
            // Call logout API with token and remove from storage
            await logoutUser();
            
            console.log('Logout completed, waiting for routing...');
            // El polling en _layout.tsx detectará que no hay token y redirigirá a /login
            // Wait a moment to ensure state propagates
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error('Logout error:', error);
            setLoading(false);
            Alert.alert('Error', `No se pudo cerrar sesión: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#20336d" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Error al cargar perfil'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ProfileHeader user={user} isDark={isDark} />

        {/* Profile Information */}
        <ProfileSection title="Información" isDark={isDark}>
          <SettingRow label="Nombre" value={user.name} isDark={isDark} />
          <SettingRow label="Email" value={user.email} isDark={isDark} />
          {user.role && <SettingRow label="Rol" value={user.role} isDark={isDark} />}
        </ProfileSection>

        {/* Settings */}
        <ProfileSection title="Configuración" isDark={isDark}>
          <SettingRow
            label="Cambiar contraseña"
            isDark={isDark}
            onPress={changePassword}
          />
          <SettingRow
            label="Notificaciones"
            isDark={isDark}
            onPress={updateNotifications}
          />
          <SettingRow
            label="Privacidad"
            isDark={isDark}
            onPress={updatePrivacy}
          />
        </ProfileSection>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[styles.logoutButton, isDark && styles.logoutButtonDark]}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  loadingTextDark: {
    color: '#aaa',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorTextDark: {
    color: '#ff6b6b',
  },
  retryButton: {
    backgroundColor: '#20336d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  profileHeaderDark: {
    backgroundColor: '#2a2a2a',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#20336d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  profileNameDark: {
    color: '#fff',
  },
  profileLevel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#20336d',
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileLevelDark: {
    color: '#64b5f6',
    backgroundColor: '#1a3a52',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  profileEmailDark: {
    color: '#aaa',
  },
  profileRole: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  profileRoleDark: {
    color: '#777',
  },
  section: {
    marginBottom: 20,
  },
  sectionDark: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  settingRowDark: {
    backgroundColor: '#2a2a2a',
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  settingLabelDark: {
    color: '#fff',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
  },
  settingValueDark: {
    color: '#888',
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonDark: {
    backgroundColor: '#c62828',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
