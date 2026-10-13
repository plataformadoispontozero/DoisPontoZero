import {vi,it,expect,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {StrategyPage} from './StrategyPage';
const state=vi.hoisted(()=>({remove:vi.fn()}));
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency-real'}));
vi.mock('./hooks/useStrategy',()=>({useStrategies:()=>({data:[{id:'strategy-a',name:'Campanha cliente A',status:'archived',channels:[],pillars:[]}],isLoading:false,isError:false}),useDeleteStrategy:()=>({mutateAsync:state.remove,isPending:false})}));
beforeEach(()=>{state.remove.mockReset().mockResolvedValue('strategy-a');});
it('requires per-strategy confirmation and reports protected dependencies without dismissing the dialog',async()=>{state.remove.mockRejectedValue({message:'Esta estratégia possui calendário vinculado.'});render(<MemoryRouter><StrategyPage/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Apagar estratégia Campanha cliente A'}));expect(state.remove).not.toHaveBeenCalled();expect(screen.getByRole('alertdialog')).toHaveTextContent('Campanha cliente A');fireEvent.click(screen.getByRole('button',{name:'Confirmar exclusão'}));await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('calendário vinculado'));expect(state.remove).toHaveBeenCalledWith('strategy-a');fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();});
