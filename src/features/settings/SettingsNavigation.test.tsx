import {render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect} from 'vitest'
import {SettingsLayout} from './components/SettingsLayout'
import {SettingsOverviewPage} from './SettingsOverviewPage'
describe('settings navigation',()=>{
 it('exposes brand identity in the named navigation with a visible keyboard focus style',()=>{
  render(<MemoryRouter initialEntries={['/settings/branding']}><SettingsLayout/></MemoryRouter>)
  expect(screen.getByRole('navigation',{name:'Configurações da agência'})).toBeInTheDocument()
  const identity=screen.getByRole('link',{name:'Identidade visual'})
  expect(identity).toHaveAttribute('href','/settings/branding')
  expect(identity).toHaveAttribute('aria-current','page')
  expect(identity.className).toContain('focus-visible:ring-2')
 })
 it('offers an identity card with a keyboard focus indicator',()=>{
  render(<MemoryRouter><SettingsOverviewPage/></MemoryRouter>)
  const identity=screen.getByRole('link',{name:/Identidade visual/})
  expect(identity).toHaveAttribute('href','/settings/branding')
  expect(identity.className).toContain('focus-visible:ring-2')
 })
})
