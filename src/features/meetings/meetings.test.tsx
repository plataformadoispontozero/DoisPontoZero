import { AuthProvider } from '@/features/auth/AuthProvider'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { MeetingsPage } from './MeetingsPage'
import { NewMeetingPage } from './NewMeetingPage'

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

describe('Meeting Hub Feature Suite', () => {
  it('renders Meeting Hub main dashboard page with title and KPIs', async () => {
    renderWithProviders(<MeetingsPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Meeting Hub/i })).toBeInTheDocument()
    expect(screen.getByText(/Reuniões da Semana/i)).toBeInTheDocument()
    expect(screen.getByText(/Próximas Agendadas/i)).toBeInTheDocument()
    expect(screen.getByText(/Atas Pendentes/i)).toBeInTheDocument()
  })

  it('renders New Meeting scheduling wizard form', async () => {
    renderWithProviders(<NewMeetingPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Agendar Nova Reunião/i })).toBeInTheDocument()
    expect(screen.getByText(/Informações Principais/i)).toBeInTheDocument()
    expect(screen.getByText(/Data & Localização/i)).toBeInTheDocument()
  })
})
