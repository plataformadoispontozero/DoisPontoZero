import {render,screen,fireEvent} from '@testing-library/react'
import {it,expect} from 'vitest'
import {PresentationHero} from './PresentationHero'
it('centers the client identity and keeps decorative animation controllable',()=>{
 const {container}=render(<PresentationHero title="Campanha do mês" clientName="Cliente" logo="https://example.com/logo.png" eyebrow="Outubro / 2026" sectionCount={3} materialCount={6}><a href="#entregas">Conhecer as entregas</a></PresentationHero>)
 expect(screen.getByRole('img',{name:'Logo de Cliente'})).toBeVisible();expect(screen.getByRole('heading',{name:'Campanha do mês'})).toBeVisible();expect(container.querySelector('.presentation-hero__background')).toHaveAttribute('aria-hidden','true')
 fireEvent.click(screen.getByRole('button',{name:'Pausar animação de fundo'}));expect(screen.getByRole('region',{name:'Apresentação do cliente'})).toHaveAttribute('data-paused','true');fireEvent.click(screen.getByRole('button',{name:'Retomar animação de fundo'}));expect(screen.getByRole('region',{name:'Apresentação do cliente'})).toHaveAttribute('data-paused','false')
 fireEvent.error(screen.getByRole('img'));expect(screen.getByText('Cliente')).toBeVisible();expect(screen.queryByRole('img')).toBeNull()
})
