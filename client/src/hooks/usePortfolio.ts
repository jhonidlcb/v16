
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Portfolio, InsertPortfolio } from "@shared/schema";

export function usePortfolio() {
  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ["/api/portfolio"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/portfolio");
      if (!response.ok) {
        throw new Error("Error al cargar el portfolio");
      }
      return await response.json() as Portfolio[];
    },
  });

  return {
    portfolio,
    isLoading,
    error,
  };
}

export function usePortfolioAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (portfolioData: InsertPortfolio) => {
      const response = await apiRequest("POST", "/api/portfolio", portfolioData);
      if (!response.ok) {
        throw new Error("Error al crear elemento del portfolio");
      }
      return await response.json() as Portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Elemento creado",
        description: "El elemento del portfolio ha sido creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear",
        description: error.message || "No se pudo crear el elemento",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Portfolio> }) => {
      const response = await apiRequest("PUT", `/api/portfolio/${id}`, updates);
      if (!response.ok) {
        throw new Error("Error al actualizar elemento del portfolio");
      }
      return await response.json() as Portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Elemento actualizado",
        description: "El elemento del portfolio ha sido actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el elemento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/portfolio/${id}`);
      if (!response.ok) {
        throw new Error("Error al eliminar elemento del portfolio");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Elemento eliminado",
        description: "El elemento del portfolio ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el elemento",
        variant: "destructive",
      });
    },
  });

  return {
    createPortfolio: createMutation.mutate,
    updatePortfolio: updateMutation.mutate,
    deletePortfolio: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
