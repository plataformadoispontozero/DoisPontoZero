import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DriveConnectionsPage } from './DriveConnectionsPage';
import { DriveBrowserPage } from './DriveBrowserPage';

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

describe('Google Drive Feature Suite', () => {
  it('renders Google Drive connection manager with title and empty state or status', async () => {
    render(<DriveConnectionsPage />, { wrapper });
    expect(screen.getByText('Google Drive Connection Manager')).toBeInTheDocument();
  });

  it('renders Google Drive file browser with controls', async () => {
    render(<DriveBrowserPage />, { wrapper });
    expect(screen.getByText('Google Drive Browser')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar arquivos autorizados por nome...')).toBeInTheDocument();
  });
});
