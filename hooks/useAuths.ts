import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

const API_URL = "http://TU_BACKEND.test/api"; // 👈 cambia por tu URL real

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Credenciales incorrectas");

      const data = await res.json();
      await AsyncStorage.setItem("token", data.token); // guarda el token
      return { success: true, token: data.token };
    } catch (error: any) {
      console.error("Login error:", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
  };

  const getToken = async () => {
    return await AsyncStorage.getItem("token");
  };

  return { login, logout, getToken, loading };
}
