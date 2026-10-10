import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { ChatPage } from './ChatPage'
import { ChatSettingsPage } from './ChatSettingsPage'

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Team Chat Feature Suite', () => {
  it('renders Team Chat main page with channels sidebar and message feed', async () => {
    renderWithProviders(<ChatPage />)

    expect(screen.getByText(/Team Chat/i)).toBeInTheDocument()
    expect(screen.getAllByText(/geral/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/Mensagens Diretas/i)).toBeInTheDocument()
  })

  it('renders Chat Settings page with active channels list', async () => {
    renderWithProviders(<ChatSettingsPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Configurações do Team Chat/i })).toBeInTheDocument()
    expect(screen.getByText(/Canais Ativos na Agência/i)).toBeInTheDocument()
  })
})
