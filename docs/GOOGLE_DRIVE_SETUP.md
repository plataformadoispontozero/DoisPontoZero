# DOIS.ZERO — Google Drive API Setup & OAuth 2.0 Integration Guide

Este guia detalha o processo completo de configuração no Google Cloud Console e a integração OAuth 2.0 com Supabase para sincronização de arquivos e pastas no **Dois.Zero Creative Agency OS**.

---

## 1. Configuração do Projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto com o nome **`DoisZero-Agency-OS`**.
3. No menu lateral, vá para **APIs e Serviços > Biblioteca**.
4. Pesquise e ative a **Google Drive API**.

---

## 2. Configuração da Tela de Consentimento OAuth

1. Acesse **APIs e Serviços > Tela de consentimento OAuth**.
2. Selecione o tipo de usuário (**External** para agências clientes ou **Internal** para conta Workspace restrita).
3. Preencha as informações do aplicativo:
   - **App Name**: `Dois.Zero Creative Agency OS`
   - **User Support Email**: `suporte@matrizcriativa.com.br`
   - **Developer Contact**: `tech@matrizcriativa.com.br`
4. Adicione os seguintes Scopes:
   - `https://www.googleapis.com/auth/drive.readonly` (para navegação e importação de materiais)
   - `https://www.googleapis.com/auth/drive.file` (para upload e gerenciamento de arquivos criados pela aplicação)

---

## 3. Criação das Credenciais OAuth 2.0

1. Vá em **APIs e Serviços > Credenciais > Criar Credenciais > ID do cliente OAuth**.
2. Selecione **Aplicação Web**.
3. Defina as URIs autorizadas:
   - **Origens JavaScript Autorizadas**:
     - `http://localhost:5173`
     - `https://suaagencia.doiszero.com.br`
   - **URIs de Redirecionamento Autorizadas**:
     - `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
     - `http://localhost:5173/drive/callback`
4. Salve e copie o **Client ID** e **Client Secret**.

---

## 4. Configuração das Variáveis no Supabase & Ambiente

No dashboard do Supabase (ou arquivo `.env.local` em desenvolvimento):

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/drive/callback
SUPABASE_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 5. Fluxo de Autenticação e Armazenamento dos Tokens Seguros

1. O usuário clica em **"Conectar Google Drive"** na interface.
2. A aplicação redireciona para o OAuth consent screen com `access_type=offline` e `prompt=consent`.
3. O código de autorização é trocado no backend / Supabase Edge Function por:
   - `access_token` (curta duração: 1 hora)
   - `refresh_token` (longa duração: persistido de forma criptografada)
4. Os tokens são armazenados na tabela `google_connections` protegida por Row Level Security (RLS) por `agency_id`.

---

## 6. Verificação de Saúde e Renovação

- O hook `useDriveConnection` monitora `expires_at`.
- Quando faltarem 5 minutos para expiração, o `refresh_token` é utilizado automaticamente para emitir um novo `access_token` sem interromper a sessão da agência.
