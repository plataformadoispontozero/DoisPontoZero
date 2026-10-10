import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { PresentationsPage } from './PresentationsPage';
import { NewPresentationPage } from './NewPresentationPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Presentation Studio Feature Suite', () => {
  it('renders Presentation Studio main dashboard page', async () => {
    render(<PresentationsPage />, { wrapper });
    expect(screen.getByText('Presentation Studio')).toBeInTheDocument();
    expect(screen.getByText('Nova Apresentação')).toBeInTheDocument();
  });

  it('renders New Presentation wizard wizard step 1', async () => {
    render(<NewPresentationPage />, { wrapper });
    expect(screen.getByText('Nova Apresentação')).toBeInTheDocument();
    expect(screen.getByText('Selecione o Cliente')).toBeInTheDocument();
  });
});
