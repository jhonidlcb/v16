import { queryClient } from "./queryClient";

const API_BASE_URL = import.meta.env.DEV ? "" : "";

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  data?: any
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  // Corregir el nombre del token para que coincida con lo que se guarda en el login
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Limpiar ambos tokens por si acaso
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
      return response;
    }

    // Log de errores para debugging
    if (!response.ok) {
      console.error(`API Error: ${method} ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        url,
        hasToken: !!token
      });
    }

    return response;
  } catch (error) {
    console.error(`Network Error: ${method} ${endpoint}`, error);
    throw error;
  }
}