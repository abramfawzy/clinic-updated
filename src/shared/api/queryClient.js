import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        const s = error?.response?.status
        // مفيش فايدة نعيد لو الخطأ من المستخدم (4xx)
        if (s && s >= 400 && s < 500) return false
        return count < 2
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
