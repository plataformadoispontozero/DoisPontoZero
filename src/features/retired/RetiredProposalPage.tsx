import { Link } from 'react-router-dom'

/** Old public links deliberately perform no proposal or token lookup. */
export function RetiredProposalPage() {
  return <main className="min-h-dvh bg-[#101014] text-[#F8F9FC] flex items-center justify-center p-6">
    <div className="w-full max-w-lg rounded-2xl border border-[#30303B] bg-[#1C1C24] p-8 space-y-5">
      <h1 className="text-2xl font-bold">Área de propostas descontinuada</h1>
      <p className="text-[#B8B8C0]">Este link não está mais disponível. Entre em contato com a agência para informações sobre o atendimento.</p>
      <Link to="/" className="inline-block rounded-lg bg-[#C74410] px-5 py-3 font-medium">Ir para o site da agência</Link>
    </div>
  </main>
}
