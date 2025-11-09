// api/apiClient.ts
import { API_URL } from "@/constants/api";
import { getToken } from "@/hooks/useAuths";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Error en la API");
  }

  return res.json();
}
