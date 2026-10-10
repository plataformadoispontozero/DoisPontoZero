import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import { Sheet, SheetHeader, SheetTitle, SheetContent } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { LoadingState, ErrorState, SuccessState } from '@/components/ui/FeedbackStates'

describe('Design System UI Components', () => {
  it('renders Button with variants and loading state', () => {
    const { rerender } = render(<Button variant="primary">Clique Aqui</Button>)
    expect(screen.getByRole('button', { name: 'Clique Aqui' })).toBeInTheDocument()

    rerender(<Button loading>Carregando</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders IconButton with accessible aria-label', () => {
    render(<IconButton aria-label="Ação Rápida">+</IconButton>)
    expect(screen.getByRole('button', { name: 'Ação Rápida' })).toBeInTheDocument()
  })

  it('renders Card with Header and Content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
        </CardHeader>
        <CardContent>Conteúdo</CardContent>
      </Card>
    )
    expect(screen.getByText('Título do Card')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('renders Badge with semantic variants', () => {
    render(<Badge variant="success">Aprovado</Badge>)
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
  })

  it('renders Avatar with name initials fallback', () => {
    render(<Avatar name="Carlos Silva" />)
    expect(screen.getByText('CS')).toBeInTheDocument()
  })

  it('renders Input and Textarea', () => {
    render(
      <div>
        <Input placeholder="Nome do Projeto" />
        <Textarea placeholder="Observações" />
      </div>
    )
    expect(screen.getByPlaceholderText('Nome do Projeto')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Observações')).toBeInTheDocument()
  })

  it('renders Select with options', () => {
    render(
      <Select defaultValue="motion">
        <option value="motion">Motion Design</option>
        <option value="social">Social Media</option>
      </Select>
    )
    expect(screen.getByRole('combobox')).toHaveValue('motion')
  })

  it('renders Tabs and handles tab switching', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Aba 1</TabsTrigger>
          <TabsTrigger value="tab2">Aba 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Conteúdo Aba 1</TabsContent>
        <TabsContent value="tab2">Conteúdo Aba 2</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Conteúdo Aba 1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Aba 2'))
    expect(screen.getByText('Conteúdo Aba 2')).toBeInTheDocument()
  })

  it('renders Dialog modal when open', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogHeader>
          <DialogTitle>Modal Teste</DialogTitle>
        </DialogHeader>
        <DialogBody>Corpo do Modal</DialogBody>
      </Dialog>
    )
    expect(screen.getByText('Modal Teste')).toBeInTheDocument()
    expect(screen.getByText('Corpo do Modal')).toBeInTheDocument()
  })

  it('renders Sheet drawer when open', () => {
    render(
      <Sheet open={true} onOpenChange={() => {}}>
        <SheetHeader>
          <SheetTitle>Painel Lateral</SheetTitle>
        </SheetHeader>
        <SheetContent>Conteúdo do Painel</SheetContent>
      </Sheet>
    )
    expect(screen.getByText('Painel Lateral')).toBeInTheDocument()
  })

  it('renders StatusIndicator and Skeleton', () => {
    render(
      <div>
        <StatusIndicator status="active" label="Em Execução" />
        <Skeleton data-testid="skeleton-item" className="w-10 h-10" />
      </div>
    )
    expect(screen.getByText('Em Execução')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-item')).toBeInTheDocument()
  })

  it('renders PageHeader and SectionHeader', () => {
    render(
      <div>
        <PageHeader title="Página Inicial" subtitle="Subtítulo da Página" />
        <SectionHeader title="Seção Operacional" />
      </div>
    )
    expect(screen.getByText('Página Inicial')).toBeInTheDocument()
    expect(screen.getByText('Subtítulo da Página')).toBeInTheDocument()
    expect(screen.getByText('Seção Operacional')).toBeInTheDocument()
  })

  it('renders Loading, Error, and Success feedback states', () => {
    const handleRetry = vi.fn()
    render(
      <div>
        <LoadingState message="Aguarde..." />
        <ErrorState message="Erro ao carregar dados" onRetry={handleRetry} />
        <SuccessState title="Operação Concluída" />
      </div>
    )
    expect(screen.getByText('Aguarde...')).toBeInTheDocument()
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    expect(screen.getByText('Operação Concluída')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Tentar novamente'))
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
