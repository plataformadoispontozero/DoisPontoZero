import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PresentationPreview, PresentationMedia } from './PresentationPreview'

describe('shared presentation preview', () => {
  it('renders ordered sections and real material thumbnails, including unassigned materials', () => {
    render(<PresentationPreview presentation={{ title: 'Campanha de outubro', client_name: 'Cliente real', period_month: 10, period_year: 2026 }} sections={[{ id: 'second', section_type: 'gallery', title: 'Peças', position: 1, content: {text:'Direção visual da campanha'} }, { id: 'first', section_type: 'objectives', title: 'Objetivo', position: 0, content: {list:['Divulgar lançamento']} }]} assets={[{id:'art',section_id:'second',title:'Arte WebP',file_reference:{mime_type:'image/webp',thumbnail_reference:'https://lh3.googleusercontent.com/art',web_view_link:'https://drive.google.com/file/d/art/view'}},{id:'extra',title:'Manual',web_view_link:'https://drive.google.com/file/d/manual/view'}]} />)
    expect(screen.getAllByRole('heading', {level:2}).map(node => node.textContent)).toEqual(['Objetivo','Peças','Materiais complementares'])
    expect(screen.getByText('Cliente real · outubro / 2026')).toBeInTheDocument()
    expect(screen.getByText('Direção visual da campanha')).toBeInTheDocument()
    expect(screen.getByRole('img',{name:'Arte WebP'})).toHaveAttribute('src','https://lh3.googleusercontent.com/art')
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('rel','noopener noreferrer')
    expect(screen.queryByText('100% dos prazos cumpridos')).not.toBeInTheDocument()
  })
  it('rejects executable links and handles unavailable thumbnail without broken media', () => {
    render(<PresentationMedia asset={{id:'x',title:'Vídeo',mime_type:'video/mp4',web_view_link:'javascript:alert(1)',thumbnail_reference:'https://lh3.googleusercontent.com/missing'}} />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Abra o vídeo original para assistir.')).toBeInTheDocument()
  })
  it('shows an honest empty presentation without invented deliverables', () => {
    render(<PresentationPreview presentation={{title:'Rascunho',period_month:11,period_year:2026}} sections={[]} assets={[]} />)
    expect(screen.getByText('Esta apresentação ainda não possui seções.')).toBeInTheDocument()
    expect(screen.getByText('0 materiais')).toBeInTheDocument()
  })
})
