# Identidade visual por cliente

Migração `20261023222534_client_brand_color_media.sql`.

## Cliente

`public.clients.brand_color` é texto opcional. Aceita somente HEX de seis dígitos com `#` (exemplo `#F97316`), ou null para remover a preferência. Não altera `profile`, permissões ou papéis. `logo_url` já existe e continua armazenando a URL pública da imagem autorizada.

## Logo pública

Bucket `client-brand-media` público, máximo **5 MiB** (5.242.880 bytes), MIME `image/png`, `image/jpeg` ou `image/webp`. Não aceita SVG/HTML. Os arquivos devem ser imagens de marca autorizadas a publicação, sem documentos privados.

Caminho: `agencyId/clientId/randomUUID.webp` (também png/jpg/jpeg). IDs e UUID do nome em minúsculas. O frontend deve validar/decodificar a imagem antes de enviar e usar upload com `upsert:false`; substituição é um novo arquivo.

- SELECT público apenas neste bucket, incluindo acesso aos logos autorizados.
- INSERT autenticado exige caminho válido, cliente existente na agência indicada e `clients.edit` nessa agência.
- DELETE autenticado exige o mesmo escopo agência/cliente e `clients.edit`, para eventual limpeza de imagem substituída.
- Não há policy UPDATE; sobrescrever ou mover objetos não é necessário para o fluxo.
- Nenhum grant global, papel, policy de outro bucket ou serviço de Drive é modificado.

## Leitura remota · 24/10/2026

Confirmados `clients.logo_url`, `clients.profile`, `clients.id/agency_id`, ausência de `brand_color` e do novo bucket; permissões `clients.edit/view` existentes. Storage já possui grants de objetos para authenticated/anon, portanto somente policies específicas do novo bucket são adicionadas. Policy de clientes permite SELECT aos membros; INSERT de mídia continua exigindo `clients.edit` via gate editorial existente. Usage de schema private já existe para authenticated.

Não houve upload, alteração de cliente, aplicação remota, teste ou deploy nesta entrega. Timestamp do arquivo gerado pelo CLI em UTC.

## Logo e ícone oficiais da agência

A mesma migração acrescenta o bucket público `agency-brand-media`, limite **2 MiB** (2.097.152 bytes), PNG/JPEG/WebP. Caminho `agencyId/randomUUID.webp` (também png/jpg/jpeg), em minúsculas. INSERT exige agência existente e `branding.edit` na agência do caminho. SELECT é público somente nesse bucket; não há UPDATE nem DELETE. Substituição deve criar novo UUID com `upsert:false`.

O frontend pode aceitar origem PNG/JPG/WebP até 5 MiB, decodificar e converter para WebP até 2 MiB antes do upload; o limite efetivo do bucket é 2 MiB. Persista a URL pública real após upload bem-sucedido, não uma URL temporária blob. São somente logos/ícones autorizados a publicação. As policies de mídia dos clientes permanecem intactas.
