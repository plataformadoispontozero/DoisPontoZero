# DOIS.ZERO — Google Drive Architecture & Synchronisation Technical Guide

Documentação técnica da arquitetura de integração do **Google Drive API** no **Dois.Zero Creative Agency OS**.

---

## 1. Visão Geral da Arquitetura

A integração entre a agência criativa e o Google Drive ocorre através de um modelo híbrido de indexação metadados + links tokenizados sem duplicar armazenamento pesado.

```
[ Agência Criativa ]
       │ (OAuth 2.0)
       ▼
[ google_connections ] ──(RLS agency_id)──► Storage de Tokens Seguros
       │
       ├─────────────────────────┐
       ▼                         ▼
[ client_drive_folders ]   [ drive_file_references ]
(Pastas por Cliente)       (Index de Peças & Videos)
       │                         │
       └───────────┬─────────────┘
                   ▼
       [ presentation_assets ]
   (Vínculo com Seção Editorial)
```

---

## 2. Tabelas Envolvidas

1. **`google_connections`**: Armazena conexões autorizadas por agência, e-mail da conta Google, escopos e tokens.
2. **`client_drive_folders`**: Mapeia pastas raiz do Drive para clientes específicos da agência.
3. **`drive_file_references`**: Indexa arquivos (vídeos MP4, carrosséis PDF, artes PNG/JPG, manuais) com `google_file_id`, `mime_type`, thumbnails e links de visualização.
4. **`presentation_assets`**: Vincula referências do Drive a seções específicas de apresentações comerciais/showcases.

---

## 3. Estrutura de Metadados & Cache Incremental

Os arquivos são sincronizados com suporte a:
- **`availability_status`**: `'available'`, `'trashed'`, `'restricted'`, `'missing'`.
- **`last_synced_at`**: Timestamp da última sincronização com a API v3 do Google Drive.
- **Thumbnails**: Cache de thumbnails diretos de baixa resolução para performance em listas sem consumir cota de download.

---

## 4. Componentes de UI Desenvolvidos

- **`DriveConnectionsPage.tsx`**: Gerenciador central de conexões Google OAuth, exibindo contas ativas, permissões e botão de autorização/desconexão.
- **`DriveBrowserPage.tsx`**: Navegador visual de arquivos autorizados com busca por nome, filtro por tipo MIME (vídeos, PDFs, imagens) e status de disponibilidade.
- **`ClientDriveTab.tsx`**: Aba integrada ao **Client Hub**, permitindo vincular pastas do Drive diretamente ao cadastro do cliente.
