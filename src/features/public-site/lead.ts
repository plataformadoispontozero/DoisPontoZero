export interface LeadDraft {
  name: string;
  email: string;
  phone: string;
  company: string;
  services: string[];
  objective: string;
  budget: string;
  consent: boolean;
  website: string;
  requestId: string;
}
export function validateLead(d: LeadDraft) {
  if (d.name.trim().length < 2 || d.name.length > 120)
    return "Informe seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || d.email.length > 254)
    return "Informe um e-mail válido.";
  if (d.phone.replace(/\D/g, "").length < 10 || d.phone.length > 30)
    return "Informe um telefone com DDD.";
  if (!d.services.length) return "Selecione pelo menos um serviço.";
  if (d.objective.trim().length < 15 || d.objective.length > 3000)
    return "Conte um pouco mais sobre seu objetivo (mínimo de 15 caracteres).";
  if (!d.consent) return "Autorize o contato para enviar seu briefing.";
  return null;
}
export function leadWhatsAppUrl(phone: string, d: LeadDraft) {
  const text = `Olá, Dois.Zero! Quero conversar sobre um projeto.\n\nNome: ${d.name.trim()}\nEmpresa: ${d.company.trim() || "Não informado"}\nE-mail: ${d.email.trim()}\nTelefone: ${d.phone.trim()}\nServiços: ${d.services.join(", ")}\nObjetivo: ${d.objective.trim()}\nInvestimento: ${d.budget || "A definir"}`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
