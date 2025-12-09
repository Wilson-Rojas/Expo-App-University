import { API_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

// storage key must match what's used in app/_layout.tsx
export const TOKEN_KEY = "@miapp:token";

// Función normal (no hook) para obtener token desde cualquier lugar
export async function getToken() {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Usuario no encontrado");
      }

      const data = await res.json();
      // try common token shape(s)
      const token = data?.token || data?.access_token || data?.accessToken;
      if (!token) throw new Error("Token no encontrado en la respuesta");

      await AsyncStorage.setItem(TOKEN_KEY, token);
      return { success: true, token };
    } catch (error: any) {
      alert(error?.message || String(error));
      return { success: false, error: error?.message || String(error) };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
  };

  return { login, logout, getToken, loading };
}
