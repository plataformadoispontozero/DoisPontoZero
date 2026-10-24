import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {BriefingTemplateEditorPage} from './BriefingTemplateEditorPage';
import {BriefingTemplatesPage} from './BriefingTemplatesPage';
import {INITIAL_BRIEFING_TEMPLATES} from '../constants/initialTemplates';
const state=vi.hoisted(()=>({save:vi.fn(),existing:null as any}));
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=> 'agency-real'}));
vi.mock('../hooks/useBriefings',()=>({useBriefingTemplates:()=>({data:[],isLoading:false}),useBriefingTemplate:()=>({data:state.existing,isLoading:false}),useCreateTemplate:()=>({mutateAsync:state.save,isPending:false})}));
beforeEach(()=>{state.save.mockReset().mockResolvedValue({id:'saved'});state.existing=null;});
describe('editable initial briefing models',()=>{
 it('shows unsaved editable starting points even for an empty real database',()=>{render(<MemoryRouter><BriefingTemplatesPage/></MemoryRouter>);for(const t of INITIAL_BRIEFING_TEMPLATES)expect(screen.getByRole('link',{name:`Personalizar modelo de ${t.name}`})).toHaveAttribute('href',`/briefings/templates/new?starterId=${t.id}`);expect(state.save).not.toHaveBeenCalled();});
 it('loads all starter questions into an editable builder and sends publication intent to atomic save',async()=>{render(<MemoryRouter initialEntries={['/briefings/templates/new?starterId=tpl-branding-v1']}><BriefingTemplateEditorPage/></MemoryRouter>);await waitFor(()=>expect(screen.getByRole('textbox',{name:'Nome do Modelo'})).toHaveValue('Branding & Identidade Visual'));fireEvent.change(screen.getByRole('textbox',{name:'Nome do Modelo'}),{target:{value:'Modelo personalizado'}});fireEvent.click(screen.getByRole('button',{name:'Publicar Modelo'}));await waitFor(()=>expect(state.save).toHaveBeenCalledOnce());const payload=state.save.mock.calls[0][0];expect(payload.name).toBe('Modelo personalizado');expect(payload.status).toBe('published');expect(payload.source_template_id).toBeNull();expect(payload.save_request_id).toMatch(/^[a-f0-9-]{36}$/);expect(payload.sections.flatMap((s:any)=>s.questions)).toHaveLength(INITIAL_BRIEFING_TEMPLATES.find(t=>t.id==='tpl-branding-v1')!.sections.flatMap(s=>s.questions).length);});
});
