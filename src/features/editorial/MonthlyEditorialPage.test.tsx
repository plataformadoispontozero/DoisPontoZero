import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MonthlyEditorialPage} from './MonthlyEditorialPage';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),invoke:vi.fn(),rows:[] as Record<string,unknown>[]}));
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency',usePermission:()=>true}));
vi.mock('./useCampaignInputs',()=>({useCampaignInputs:()=>({strategies:{data:[]},pillars:{data:[]},history:{data:[]},repertoire:{data:undefined}})}));
vi.mock('@/lib/supabase/client',()=>({supabase:{functions:{invoke:(...args:unknown[])=>mocks.invoke(...args)},rpc:(...args:unknown[])=>mocks.rpc(...args),from:(table:string)=>{const filters:Record<string,unknown>={};const q={select:()=>q,eq:(key:string,value:unknown)=>{filters[key]=value;return q;},is:()=>q,order:()=>q,limit:()=>q,range:()=>q,then:(resolve:(value:unknown)=>unknown)=>resolve({data:table==='clients'?mocks.rows:table==='briefings'&&filters.client_id==='a'?[{id:'brief-a',title:'Brief nativo',status:'submitted'}]:[],error:null})};return q;}}}));
function show(){return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/editorial/new']}><MonthlyEditorialPage/></MemoryRouter></QueryClientProvider>)}
beforeEach(()=>{mocks.invoke.mockReset().mockResolvedValue({data:{provider:'none',generationAvailable:false,model:''},error:null});mocks.rows=[{id:'a',name:'Cliente A',profile:{monthly_objective:'Objetivo A',target_audience:'Audiência A',niche:'Engenharia'}},{id:'b',name:'Cliente B',profile:{monthly_objective:'Objetivo B',target_audience:'Audiência B',niche:'Saúde'}}];mocks.rpc.mockReset().mockResolvedValue({data:{answers:[{questionKey:'objetivo_principal',value:'Objetivo do briefing'},{questionKey:'persona_descricao',value:'Audiência do briefing'}],revision:'r1',updatedAt:'2026-10-13'},error:null});});
async function selectClient(){await screen.findByRole('option',{name:'Cliente A'});fireEvent.change(screen.getByRole('combobox',{name:'Cliente'}),{target:{value:'a'}});await waitFor(()=>expect(screen.getByRole('combobox',{name:'Briefing do cliente'})).toHaveValue('brief-a'));await waitFor(()=>expect(mocks.rpc).toHaveBeenCalled());await waitFor(()=>expect(screen.getByLabelText('Objetivo')).toHaveValue('Objetivo do briefing'));}
describe('guided campaign creation',()=>{
 it('loads client briefing automatically and reveals only the current step',async()=>{show();expect(screen.queryByRole('button',{name:'Criar calendário'})).not.toBeInTheDocument();expect(screen.getByRole('button',{name:/ETAPA 2/})).toBeDisabled();await selectClient();expect(screen.queryByRole('textbox',{name:'Objetivo'})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));expect(screen.getByLabelText('Objetivo')).toHaveValue('Objetivo do briefing');expect(screen.getByLabelText('Público-alvo')).toHaveValue('Audiência do briefing');expect(screen.queryByRole('spinbutton',{name:'Slides por carrossel'})).not.toBeInTheDocument();expect(screen.queryByText('Campanhas salvas')).not.toBeInTheDocument();});
 it('retains reviewed direction and distributes the monthly mix without manual quantities',async()=>{show();await selectClient();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));fireEvent.change(screen.getByLabelText('Objetivo'),{target:{value:'Objetivo da social media'}});fireEvent.click(screen.getByRole('button',{name:'Continuar'}));expect(screen.getByRole('heading',{name:'Seu plano automático do mês'})).toBeInTheDocument();expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();expect(screen.getByText(/Carrossel: 5 lâminas/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));expect(screen.getByText('5 posts · 3 reels · 4 carrosséis')).toBeInTheDocument();expect(screen.getByText(/5 lâminas por carrossel · Reels de 30, 40 ou 50 segundos/)).toBeInTheDocument();expect(screen.getByText('Objetivo: Objetivo da social media')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Anterior'}));fireEvent.click(screen.getByRole('button',{name:'Anterior'}));expect(screen.getByLabelText('Objetivo')).toHaveValue('Objetivo da social media');});
 it('clears client A briefing and edited direction when changing to client B',async()=>{show();await selectClient();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));fireEvent.change(screen.getByLabelText('Objetivo'),{target:{value:'Objetivo privado A'}});fireEvent.click(screen.getByRole('button',{name:'Anterior'}));fireEvent.change(screen.getByRole('combobox',{name:'Cliente'}),{target:{value:'b'}});await waitFor(()=>expect(screen.getByRole('combobox',{name:'Briefing do cliente'})).toHaveValue(''));fireEvent.click(screen.getByRole('button',{name:'Continuar'}));expect(screen.getByLabelText('Objetivo')).toHaveValue('Objetivo B');expect(screen.getByLabelText('Público-alvo')).toHaveValue('Audiência B');expect(screen.getByRole('textbox',{name:'Temas da campanha'})).not.toHaveValue(expect.stringContaining('Engenharia'));});
});

it('does not replace a human edit when a briefing response arrives later',async()=>{let resolve!:(value:unknown)=>void;mocks.rpc.mockImplementation(()=>new Promise(done=>{resolve=done;}));show();await screen.findByRole('option',{name:'Cliente A'});fireEvent.change(screen.getByRole('combobox',{name:'Cliente'}),{target:{value:'a'}});await waitFor(()=>expect(mocks.rpc).toHaveBeenCalled());fireEvent.click(screen.getByRole('button',{name:/ETAPA 2/}));fireEvent.change(screen.getByLabelText('Objetivo'),{target:{value:'Objetivo humano preservado'}});resolve({data:{answers:[{questionKey:'objetivo_principal',value:'Objetivo tardio'},{questionKey:'persona_descricao',value:'Audiência atualizada'}],revision:'r1',updatedAt:'2026-10-13'},error:null});await waitFor(()=>expect(screen.getByLabelText('Público-alvo')).toHaveValue('Audiência atualizada'));expect(screen.getByLabelText('Objetivo')).toHaveValue('Objetivo humano preservado');});

it('blocks jumping over incomplete direction without saving or sending content',async()=>{
 show();await selectClient();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 fireEvent.change(screen.getByLabelText('Objetivo'),{target:{value:''}});
 fireEvent.click(screen.getByRole('button',{name:/ETAPA 4/}));
 expect(screen.getByLabelText('Objetivo')).toBeInTheDocument();
 expect(screen.getByText(/Antes de continuar, complete: objetivo do mês/)).toBeInTheDocument();
 expect(mocks.rpc.mock.calls.every(call=>call[0]==='get_editorial_briefing')).toBe(true);
});

it('starts editorial direction with the monthly text and keeps briefing context expandable',async()=>{
 show();await selectClient();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 const direction=screen.getByRole('textbox',{name:'Direção, copy e estratégia deste mês'});
 expect(direction).toHaveAttribute('maxLength','6000');expect(direction).toHaveAttribute('minLength','20');
 expect(screen.getByText('0 / 6000 caracteres')).toBeInTheDocument();
 const summary=screen.getByText('Contexto do cliente e briefing');
 expect(summary.closest('details')).not.toHaveAttribute('open');
 expect(direction.compareDocumentPosition(summary)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 fireEvent.change(direction,{target:{value:'Posicionamento e prioridades deste mês'}});
 expect(screen.getByText('38 / 6000 caracteres')).toBeInTheDocument();
 expect(screen.getAllByLabelText('Direção, copy e estratégia deste mês')).toHaveLength(1);
});


it('uses an explicit eighteen-material strategy and keeps the requested mix in the automatic plan',async()=>{
 show();await selectClient();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 fireEvent.change(screen.getByRole('combobox',{name:'Modo de planejamento'}),{target:{value:'gemini'}});
 fireEvent.change(screen.getByRole('textbox',{name:'Direção, copy e estratégia deste mês'}),{target:{value:'18 materiais: 10 reels, 4 posts e 4 carrosséis. Priorizar apresentação dos serviços.'}});
 fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 await screen.findByRole('heading',{name:'Seu plano automático do mês'});
 expect(screen.getByText(/18 materiais · Quantidades especificadas/)).toBeInTheDocument();
 expect(mocks.invoke.mock.calls.some(call=>call[1]?.body.action==='plan')).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 expect(screen.getByText('4 posts · 10 reels · 4 carrosséis')).toBeInTheDocument();
});
it('asks Gemini for a client-specific mix when direction gives no format counts',async()=>{
 mocks.invoke.mockImplementation(async(_name:string,{body}:any)=>({data:body.action==='status'?{provider:'gemini',generationAvailable:true,model:'gemini-test'}:{total:12,formatCounts:{post:2,carousel:2,reels:8},reason:'Foco em vídeo para apresentar os serviços.',provider:'gemini',model:'gemini-test',requiresReview:true},error:null}));
 show();await selectClient();fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 await waitFor(()=>expect(screen.getByRole('combobox',{name:'Modo de planejamento'})).toHaveValue('gemini'));
 fireEvent.change(screen.getByRole('textbox',{name:'Direção, copy e estratégia deste mês'}),{target:{value:'Priorizar vídeo para apresentar a equipe e os serviços neste mês.'}});
 fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 expect(await screen.findByText(/12 materiais · Foco em vídeo/)).toBeInTheDocument();
 expect(mocks.invoke.mock.calls.find(call=>call[1]?.body.action==='plan')?.[1].body).toMatchObject({clientId:'a',count:12,requiredCounts:{}});
});
