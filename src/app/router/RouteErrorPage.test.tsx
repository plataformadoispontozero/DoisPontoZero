import {render,screen} from '@testing-library/react'
import {createMemoryRouter,RouterProvider} from 'react-router-dom'
import {describe,it,expect,vi} from 'vitest'
import {RouteErrorPage} from './RouteErrorPage'
vi.mock('@/app/runtime/moduleRecovery',()=>({isModuleLoadError:(e:Error)=>e.message.includes('dynamically imported'),recoverModuleLoad:vi.fn(()=>false)}))
describe('route error fallback',()=>{
 it('shows recovery actions instead of exposing an import URL or stack',async()=>{const router=createMemoryRouter([{path:'/',loader:()=>{throw Error('Failed to fetch dynamically imported module: /assets/private-old.js')},element:<div/>,errorElement:<RouteErrorPage/>}]);render(<RouterProvider router={router}/>);expect(await screen.findByRole('heading',{name:'Vamos atualizar esta página'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Recarregar página'})).toBeInTheDocument();expect(screen.getByRole('link',{name:'Voltar ao painel'})).toHaveAttribute('href','/dashboard');expect(screen.queryByText(/private-old/)).not.toBeInTheDocument()})
 it('does not misclassify other application failures as an update',async()=>{const router=createMemoryRouter([{path:'/',loader:()=>{throw Error('Internal private error')},errorElement:<RouteErrorPage/>}]);render(<RouterProvider router={router}/>);expect(await screen.findByRole('heading',{name:'Não foi possível abrir esta página'})).toBeInTheDocument();expect(screen.queryByText(/Internal private/)).not.toBeInTheDocument()})
})
