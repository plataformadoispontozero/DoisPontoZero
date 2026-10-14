import {render,screen,fireEvent} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
import {DemandContent} from './DemandContent';
import {parseDemandContent} from './parseDemandContent';
describe('demand reading and editing',()=>{
 it('shows each carousel slide and its complete direction without a cramped text field',()=>{
 const value='carousel\n\nUma pausa\n\nLegenda sem cortes.\n\nLâmina 1: Capa\nTexto 1\nDireção: contraste\n\nLâmina 2: Desenvolvimento\nTexto 2\n\nDireção visual: Creme e terracota';
 render(<DemandContent value={value}/>);expect(screen.getByText('Carrossel · 2 lâminas')).toBeInTheDocument();expect(screen.getByRole('heading',{name:'Lâmina 1'})).toBeInTheDocument();expect(screen.getByText(/Texto 1/)).toHaveTextContent('Direção: contraste');expect(screen.getByRole('heading',{name:'Direção visual'})).toBeInTheDocument();expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 });
 it('keeps free text intact and allows editing/saving the exact description',()=>{
 const value='Texto livre\n\nSegunda linha com espaços  e acentos.',change=vi.fn(),save=vi.fn();render(<DemandContent value={value} onChange={change} onSave={save}/>);expect(screen.getByText(/Segunda linha/)).toHaveTextContent('Texto livre');fireEvent.click(screen.getByRole('button',{name:'Editar conteúdo'}));const field=screen.getByRole('textbox',{name:'Texto completo da demanda'});expect(field).toHaveValue(value);expect(field).toHaveStyle({height:'420px'});fireEvent.change(field,{target:{value:''}});expect(change).toHaveBeenCalledWith('');fireEvent.blur(field);expect(save).toHaveBeenCalledOnce();
 });
 it('renders post headline, support and caption in separate full blocks',()=>{
 const result=parseDemandContent('post\nTexto da arte: Sua pausa\nApoio: Um café\nLegenda: Texto completo\nDireção visual geral: Arco em creme');expect(result.kind).toBe('Post');expect(result.blocks.map(b=>b.label)).toEqual(['Texto da arte','Apoio','Legenda','Direção visual geral']);expect(result.blocks[2].body).toBe('Texto completo');
 });
 it('recognizes generated scripts and explicit inline manual scenes while keeping all text',()=>{
 const generated=parseDemandContent('reels\nCena 1 (10s): Fala 1\nNa tela: Texto 1\nCena 2 (20s): Fala 2\nLegenda: Final');expect(generated.blocks.filter(b=>b.kind==='scene')).toHaveLength(2);expect(generated.blocks[0].body).toContain('Na tela: Texto 1');
 const manual=parseDemandContent('Teste. Cena 1, 0–8s: Xícara. Cena 2, 8–20s: Mesa. Cena 3, 20–30s: Identidade.');expect(manual.kind).toBe('Roteiro');expect(manual.blocks.filter(b=>b.kind==='scene')).toHaveLength(3);expect(manual.intro).toBe('Teste.');
 });
 it('does not execute or interpret HTML inside the description',()=>{
 render(<DemandContent value={'post\n<script>alert(1)</script>'}/>);expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();expect(document.querySelector('script')).toBeNull();
 });
});
