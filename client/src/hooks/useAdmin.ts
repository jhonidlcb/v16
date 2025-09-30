
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "./useAuth";
import { useWebSocket } from "./useWebSocket";
import { useToast } from "./use-toast";
import type { User } from "@shared/schema";
import type { DashboardStats } from "@/types";

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected } = useWebSocket();

  // No necesitamos conectar manualmente al WebSocket aquí,
  // el hook useWebSocket ya maneja la conexión automáticamente

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      console.log("🔄 Fetching admin stats...");
      const response = await apiRequest("GET", "/api/admin/stats");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error fetching admin stats:", response.status, errorText);
        throw new Error(`Error fetching admin stats: ${response.status}`);
      }
      const data = await response.json();
      console.log("✅ Admin stats loaded:", data);
      return data;
    },
    enabled: user?.role === "admin",
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      console.log("🔄 Fetching users...");
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error fetching users:", response.status, errorText);
        throw new Error(`Error fetching users: ${response.status}`);
      }
      const data = await response.json();
      console.log("✅ Users loaded:", data.length, "users");
      return data;
    },
    enabled: user?.role === "admin",
    staleTime: 15000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: userStats,
    isLoading: userStatsLoading,
    error: userStatsError,
    refetch: refetchUserStats,
  } = useQuery({
    queryKey: ["admin", "users", "stats"],
    queryFn: async () => {
      console.log("🔄 Fetching user stats...");
      const response = await apiRequest("GET", "/api/admin/users/stats");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error fetching user stats:", response.status, errorText);
        throw new Error(`Error fetching user stats: ${response.status}`);
      }
      const data = await response.json();
      console.log("✅ User stats loaded:", data);
      return data;
    },
    enabled: user?.role === "admin",
    staleTime: 15000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Show error toast only for critical errors, not for loading states
  useEffect(() => {
    if (statsError || usersError || userStatsError) {
      const error = statsError || usersError || userStatsError;
      console.error("❌ Error en useAdmin:", error);
      
      // Solo mostrar toast para errores críticos, no para timeouts o errores temporales
      if (error?.message && !error.message.includes("timeout") && !error.message.includes("network")) {
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "Problema al cargar datos del administrador. Reintentando...",
        });
      }
    }
  }, [statsError, usersError, userStatsError, toast]);

  const isLoading = statsLoading || usersLoading || userStatsLoading;
  const error = statsError || usersError || userStatsError;

  // Log current state for debugging
  useEffect(() => {
    console.log("🔍 useAdmin state:", {
      isLoading,
      hasError: !!error,
      hasStats: !!stats,
      hasUsers: !!users,
      userRole: user?.role,
      errorMessage: error?.message
    });
  }, [isLoading, error, stats, users, user?.role]);

  return {
    stats: stats as DashboardStats | undefined,
    users: users as User[] | undefined,
    userStats: userStats,
    isLoading,
    error,
    refetchUsers,
    refetchUserStats,
  };
}
