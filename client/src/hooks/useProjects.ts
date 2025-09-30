
import { useQuery } from "@tanstack/react-query";
import type { Project, Portfolio } from "@shared/schema";
import { apiRequest } from "@/lib/api";

export function useProjects() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      return await response.json();
    },
  });

  return {
    projects: projects as Project[] | undefined,
    isLoading,
    error,
  };
}

export function usePortfolio() {
  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ["/api/portfolio"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/portfolio");
      return await response.json();
    },
  });

  return {
    portfolio: portfolio as Portfolio[] | undefined,
    isLoading,
    error,
  };
}
