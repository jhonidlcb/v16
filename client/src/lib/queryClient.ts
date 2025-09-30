import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
      gcTime: 15 * 60 * 1000, // 15 minutes (renamed from cacheTime in v5)
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors or 401/403 errors
        if (error?.message?.includes("401") || error?.message?.includes("unauthorized") || 
            error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false, // CHANGED: Prevent constant refetches
      refetchOnReconnect: false, // ADDED: Prevent refetch on reconnect
      refetchInterval: false, // ADDED: Disable automatic refetching
    },
    mutations: {
      retry: false,
    },
  },
});