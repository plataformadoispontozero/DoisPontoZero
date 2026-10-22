import {render,screen} from '@testing-library/react'
import {describe,it,expect} from 'vitest'
import {CurrentValidation} from './CurrentValidation'
describe('dated diagnostic evidence',()=>{it('keeps verified scopes separate from real validation still pending',()=>{render(<CurrentValidation/>);expect(screen.getByRole('heading',{name:'Checklist de fechamento'})).toBeInTheDocument();expect(screen.getByText('Verificação de 22/10/2026')).toBeInTheDocument();expect(screen.getByText('Cadastro, e-mail e segurança')).toBeInTheDocument();expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0);expect(screen.queryByText('Sistema totalmente homologado')).not.toBeInTheDocument()})})
