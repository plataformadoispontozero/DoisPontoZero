import React, { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrandingProvider } from '@/app/providers/BrandingProvider'
import { ToastProvider } from '@/components/ui/Toast'

interface AppProvidersProps {
  children: ReactNode
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <ToastProvider>{children}</ToastProvider>
      </BrandingProvider>
    </QueryClientProvider>
  )
}

