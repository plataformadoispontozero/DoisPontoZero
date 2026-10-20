import { fireEvent, render as rtlRender, screen } from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
const render=(ui:React.ReactNode)=>rtlRender(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{ui}</QueryClientProvider>)
import { describe, expect, it,vi } from 'vitest'
import { PresentationPreview, PresentationMedia,highQualityThumbnail } from './PresentationPreview'

describe('shared presentation preview', () => {
  it('renders ordered sections and real material thumbnails, including unassigned materials', () => {
    render(<PresentationPreview presentation={{ title: 'Campanha de outubro', client_name: 'Cliente real', period_month: 10, period_year: 2026 }} sections={[{ id: 'second', section_type: 'gallery', title: 'Peças', position: 1, content: {text:'Direção visual da campanha'} }, { id: 'first', section_type: 'objectives', title: 'Objetivo', position: 0, content: {list:['Divulgar lançamento']} }]} assets={[{id:'art',section_id:'second',title:'Arte WebP',file_reference:{mime_type:'image/webp',thumbnail_reference:'https://lh3.googleusercontent.com/art',web_view_link:'https://drive.google.com/file/d/art/view'}},{id:'extra',title:'Manual',web_view_link:'https://drive.google.com/file/d/manual/view'}]} />)
    expect(screen.getAllByRole('heading', {level:2}).map(node => node.textContent)).toEqual(['Objetivo','Peças','Materiais complementares'])
    expect(screen.getByText('Cliente real · outubro / 2026')).toBeInTheDocument()
    expect(screen.getByText('Direção visual da campanha')).toBeInTheDocument()
    expect(screen.getByRole('img',{name:'Arte WebP'})).toHaveAttribute('src','https://lh3.googleusercontent.com/art')
    expect(screen.queryByRole('link',{name:/Drive/})).not.toBeInTheDocument();expect(screen.getAllByRole('button',{name:'Aprovar'})[0]).toBeDisabled()
    expect(screen.queryByText('100% dos prazos cumpridos')).not.toBeInTheDocument()
  })
  it('rejects executable links and handles unavailable thumbnail without broken media', () => {
    render(<PresentationMedia asset={{id:'x',title:'Vídeo',mime_type:'video/mp4',web_view_link:'javascript:alert(1)',thumbnail_reference:'https://lh3.googleusercontent.com/missing'}} />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Prévia do material indisponível.')).toBeInTheDocument()
  })
  it('shows an honest empty presentation without invented deliverables', () => {
    render(<PresentationPreview presentation={{title:'Rascunho',period_month:11,period_year:2026}} sections={[]} assets={[]} />)
    expect(screen.getByText('Esta apresentação ainda não possui seções.')).toBeInTheDocument()
    expect(screen.getByText('0 materiais')).toBeInTheDocument()
  })
})

it('requests full-sized Google thumbnail and falls back if unavailable',()=>{expect(highQualityThumbnail('https://lh3.googleusercontent.com/art=s220')).toBe('https://lh3.googleusercontent.com/art=s1600');expect(highQualityThumbnail('javascript:alert(1)')).toBeUndefined();render(<PresentationMedia asset={{id:'hq',title:'Arte',thumbnail_reference:'https://lh3.googleusercontent.com/art=s220'}}/>);expect(screen.getByRole('img',{name:'Arte'})).toHaveAttribute('src','https://lh3.googleusercontent.com/art=s1600');fireEvent.error(screen.getByRole('img',{name:'Arte'}));expect(screen.getByRole('img',{name:'Arte'})).toHaveAttribute('src','https://lh3.googleusercontent.com/art=s220')})
it('requires actionable feedback and saves the decision for the exact material',async()=>{const save=vi.fn().mockResolvedValue(undefined);render(<PresentationMedia asset={{id:'selected-asset',title:'Arte'}} onReview={save}/>);fireEvent.click(screen.getByRole('button',{name:'Reprovar'}));expect(screen.getByRole('button',{name:'Enviar retorno'})).toBeDisabled();fireEvent.change(screen.getByLabelText('Por que o material foi reprovado?'),{target:{value:'Ajustar contraste'}});fireEvent.click(screen.getByRole('button',{name:'Enviar retorno'}));expect(save).toHaveBeenCalledWith('selected-asset','rejected','Ajustar contraste');expect(await screen.findByText('Reprovado')).toBeInTheDocument()})
it('never reports successful approval when persistence fails',async()=>{render(<PresentationMedia asset={{id:'asset',title:'Arte'}} onReview={vi.fn().mockRejectedValue(new Error('Falha ao salvar'))}/>);fireEvent.click(screen.getByRole('button',{name:'Aprovar'}));expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar');expect(screen.queryByText('Aprovado')).not.toBeInTheDocument()})

it('renders section illustrations without registering fake Drive references and rejects unsafe URLs',()=>{
 render(<PresentationPreview presentation={{title:'Campanha fictícia',client_name:'Aurora',period_month:11,period_year:2026}} sections={[{id:'illustrations',section_type:'gallery',title:'Artes de demonstração',position:0,content:{images:[{src:'https://doispontozero.renatodesigner.com.br/testes/aurora-cafe/post-01.svg',alt:'Post de teste'},{src:'javascript:alert(1)',alt:'Não renderizar'}]}}]} assets={[]}/>);
 expect(screen.getByRole('img',{name:'Post de teste'})).toHaveAttribute('src','https://doispontozero.renatodesigner.com.br/testes/aurora-cafe/post-01.svg');
 expect(screen.queryByRole('img',{name:'Não renderizar'})).not.toBeInTheDocument();expect(screen.getByText('1 material')).toBeInTheDocument();
});

it('navigates images by arrows and keyboard while keeping decisions on the exact asset',async()=>{
 const {PresentationGallery}=await import('./PresentationPreview');const save=vi.fn().mockResolvedValue(undefined);render(<PresentationGallery layout="slideshow" assets={[{id:'first',title:'Post 1',thumbnail_reference:'https://example.com/1.png'},{id:'second',title:'Post 2',thumbnail_reference:'https://example.com/2.png'}]} onReview={save}/>);expect(screen.getByRole('img',{name:'Post 1'})).toBeVisible();expect(screen.queryByRole('button',{name:'Solicitar ajuste'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Próxima imagem'}));expect(screen.getByRole('img',{name:'Post 2'})).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'Aprovar'}));expect(save).toHaveBeenCalledWith('second','approved','');fireEvent.keyDown(screen.getByRole('region',{name:'Galeria de materiais'}),{key:'ArrowLeft'});expect(screen.getByRole('img',{name:'Post 1'})).toBeVisible()
})

it('shows individual posts together by default and orders carousel slides numerically',async()=>{
 const {PresentationGallery}=await import('./PresentationPreview');const assets=[{id:'ten',title:'Post 10',thumbnail_reference:'https://example.com/10.png'},{id:'two',title:'Post 2',thumbnail_reference:'https://example.com/2.png'},{id:'one',title:'Post 1',thumbnail_reference:'https://example.com/1.png'}]
 const page=render(<PresentationGallery assets={assets}/>);expect(screen.getAllByRole('img')).toHaveLength(3);expect(screen.queryByRole('button',{name:'Próxima imagem'})).toBeNull();page.unmount()
 render(<PresentationGallery assets={assets} layout="carousel"/>);expect(screen.getAllByRole('img').map(node=>node.getAttribute('alt'))).toEqual(['Post 1','Post 2','Post 10']);expect(screen.getByRole('region',{name:'Carrossel de artes'})).toBeVisible()
})
