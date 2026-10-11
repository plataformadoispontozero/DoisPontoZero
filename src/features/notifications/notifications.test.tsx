import { AuthProvider } from '@/features/auth/AuthProvider'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { NotificationsPage } from './NotificationsPage'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <AuthProvider><QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider></AuthProvider>
  )
}

describe('Notifications Feature Suite', () => {
  it('renders Notifications page with central header and notifications list', async () => {
    renderWithProviders(<NotificationsPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Central de Notificações/i })).toBeInTheDocument()
    expect(screen.getByText(/Convite para Reunião de Alinhamento/i)).toBeInTheDocument()
  })
})
