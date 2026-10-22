import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppearanceSettingsPage } from './AppearanceSettingsPage'
const state = vi.hoisted(() => ({ branding: {agency_id: 'agency-a', theme_mode: 'dark'}, isLoading: false, isError: false, update: vi.fn(), refetch: vi.fn() }))
vi.mock('./hooks/useAgencySettings', () => ({useAgencyBranding: () => ({branding: state.branding, isLoading: state.isLoading, isError: state.isError, updateBranding: state.update, refetch: state.refetch})}))
vi.mock('@/components/ui/Toast', () => ({toast: {success: vi.fn(), error: vi.fn()}}))
beforeEach(() => {state.branding = {agency_id:'agency-a', theme_mode:'dark'}; state.isLoading = false; state.isError = false; state.update.mockReset(); state.update.mockResolvedValue({}); state.refetch.mockReset()})
describe('appearance settings available MVP behavior', () => {
  it('waits for saved settings before showing the form', () => {
    state.isLoading = true
    const {rerender} = render(<AppearanceSettingsPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando aparência')
    expect(screen.queryByRole('button', {name:'Salvar Preferência'})).not.toBeInTheDocument()
    state.branding = {agency_id:'agency-a', theme_mode:'system'}
    state.isLoading = false
    rerender(<AppearanceSettingsPage />)
    expect(screen.getByRole('button', {name:/Sincronizado com Sistema/})).toHaveAttribute('aria-pressed','true')
    expect(screen.getByRole('button', {name:'Salvar Preferência'})).toBeEnabled()
  })
  it('offers retry after loading fails', () => {
    state.isError = true
    render(<AppearanceSettingsPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar')
    fireEvent.click(screen.getByRole('button', {name:'Tentar novamente'}))
    expect(state.refetch).toHaveBeenCalledOnce()
  })
  it('saves all three functional themes', async () => {
    render(<AppearanceSettingsPage />)
    expect(screen.getByRole('button', {name:/Tema Claro/})).toBeEnabled()
    expect(screen.getByRole('button', {name:/Sincronizado com Sistema/})).toBeEnabled()
    expect(screen.getByRole('button', {name:/Tema Escuro/})).toHaveAttribute('aria-pressed','true')
    fireEvent.click(screen.getByRole('button', {name:'Salvar Preferência'}))
    await waitFor(() => expect(state.update).toHaveBeenCalledWith({theme_mode:'dark'}))
    fireEvent.click(screen.getByRole('button', {name:/Tema Claro/}))
    fireEvent.click(screen.getByRole('button', {name:'Salvar Preferência'}))
    await waitFor(() => expect(state.update).toHaveBeenCalledWith({theme_mode:'light'}))
    fireEvent.click(screen.getByRole('button', {name:/Sincronizado com Sistema/}))
    fireEvent.click(screen.getByRole('button', {name:'Salvar Preferência'}))
    await waitFor(() => expect(state.update).toHaveBeenCalledWith({theme_mode:'system'}))
  })
  it('does not carry the previous agency theme into another agency form', () => {
    state.branding = {agency_id:'agency-a', theme_mode:'system'}
    const {rerender} = render(<AppearanceSettingsPage />)
    state.branding = {agency_id:'agency-b', theme_mode:'dark'}
    rerender(<AppearanceSettingsPage />)
    expect(screen.getByRole('button', {name:/Tema Escuro/})).toHaveAttribute('aria-pressed','true')
  })
})
