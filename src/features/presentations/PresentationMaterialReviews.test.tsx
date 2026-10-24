import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect,vi,beforeEach} from 'vitest'
import {PresentationMaterialReviews} from './PresentationMaterialReviews'
import {ProductionReturnDialog} from './ProductionReturnDialog'
const mocks=vi.hoisted(()=>({sent:[] as any[],tasks:[] as any[],mutate:vi.fn(),error:false}))
vi.mock('@/features/auth/AuthProvider',()=>({usePermission:()=>true}))
vi.mock('./hooks/useProductionReturns',()=>({useProductionReturns:()=>({data:mocks.sent,isLoading:false,isError:mocks.error}),useProductionDestinations:()=>({data:{tasks:mocks.tasks,projects:[]},isLoading:false,isError:false}),useReturnToProduction:()=>({mutateAsync:mocks.mutate,isPending:false})}))
vi.mock('./presentationMedia',()=>({PresentationAssetThumbnail:()=>null}))
const review={id:'r',asset_id:'a',decision:'changes_requested' as const,note:'Corrigir a copy',created_at:'2026-10-20T12:00:00Z'}
beforeEach(()=>{mocks.sent=[];mocks.tasks=[];mocks.error=false;mocks.mutate.mockReset()})
function panel(reviews=[review]){render(<MemoryRouter><PresentationMaterialReviews reviews={reviews} assets={[{id:'a',title:'Post 1'}]} error={false} presentationId="p" clientId="c"/></MemoryRouter>)}
describe('production review panel',()=>{
 it('shows latest decision only and keeps older notes in history',()=>{panel([review,{...review,id:'old',note:'Anterior',created_at:'2026-10-19T12:00:00Z'}]);expect(screen.getAllByRole('button',{name:'Reenviar para produção'})).toHaveLength(1);expect(screen.getByText('Histórico de avaliações anteriores (1)')).toBeInTheDocument()})
 it('does not offer requeue for approved materials',()=>{panel([{...review,decision:'approved'} as any]);expect(screen.queryByRole('button',{name:'Reenviar para produção'})).not.toBeInTheDocument();expect(screen.getByText('Sem ajustes pendentes')).toBeInTheDocument()})
 it('shows saved task receipt instead of duplicate action',()=>{mocks.sent=[{review_id:'r',task_id:'t',created_at:review.created_at}];panel();expect(screen.getByRole('link',{name:'Abrir demanda'})).toHaveAttribute('href','/tasks/t');expect(screen.queryByRole('button',{name:'Reenviar para produção'})).not.toBeInTheDocument()})
 it('disables requeue when receipts cannot be checked',()=>{mocks.error=true;panel();expect(screen.getByRole('button',{name:'Reenviar para produção'})).toBeDisabled()})
})
describe('return confirmation',()=>{
 it('creates only after confirmation with selected department',async()=>{mocks.mutate.mockResolvedValue({task_id:'t'});const sent=vi.fn();render(<ProductionReturnDialog review={review} clientId="c" materialName="Post" onClose={vi.fn()} onSent={sent}/>);expect(mocks.mutate).not.toHaveBeenCalled();fireEvent.change(screen.getByLabelText('Setor'),{target:{value:'video'}});fireEvent.click(screen.getByRole('button',{name:'Criar e enviar ajuste'}));await waitFor(()=>expect(sent).toHaveBeenCalledWith('t'));expect(mocks.mutate).toHaveBeenCalledWith({reviewId:'r',projectId:undefined,department:'video'})})
 it('reopens selected demand without creating another',async()=>{mocks.tasks=[{id:'t',title:'[Design] Post',project:{name:'Campanha'}}];mocks.mutate.mockResolvedValue({task_id:'t'});render(<ProductionReturnDialog review={review} clientId="c" materialName="Post" onClose={vi.fn()} onSent={vi.fn()}/>);fireEvent.change(screen.getByLabelText('Demanda de produção'),{target:{value:'t'}});fireEvent.click(screen.getByRole('button',{name:'Confirmar reenvio'}));await waitFor(()=>expect(mocks.mutate).toHaveBeenCalledWith({reviewId:'r',taskId:'t'}))})
})
