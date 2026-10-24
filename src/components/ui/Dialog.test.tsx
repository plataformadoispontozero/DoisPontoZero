import {render,fireEvent} from '@testing-library/react'
import {describe,it,expect,vi} from 'vitest'
import {Dialog} from './Dialog'
describe('shared dialog lifecycle',()=>{
 it('closed dialogs never unlock another dialog and original overflow is restored',()=>{document.body.style.overflow='auto';const opened=render(<Dialog open onOpenChange={vi.fn()}>Aberto</Dialog>);const closed=render(<Dialog open={false} onOpenChange={vi.fn()}>Fechado</Dialog>);expect(document.body.style.overflow).toBe('hidden');closed.unmount();expect(document.body.style.overflow).toBe('hidden');opened.unmount();expect(document.body.style.overflow).toBe('auto');document.body.style.overflow=''})
 it('Escape only closes top dialog and preserves lock until last unmount',()=>{const first=vi.fn(),second=vi.fn();const a=render(<Dialog open onOpenChange={first}>Primeiro</Dialog>),b=render(<Dialog open onOpenChange={second}>Segundo</Dialog>);fireEvent.keyDown(document,{key:'Escape'});expect(second).toHaveBeenCalledWith(false);expect(first).not.toHaveBeenCalled();b.unmount();expect(document.body.style.overflow).toBe('hidden');fireEvent.keyDown(document,{key:'Escape'});expect(first).toHaveBeenCalledWith(false);a.unmount();expect(document.body.style.overflow).toBe('')})
})
