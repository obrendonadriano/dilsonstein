# Dilson Stein Landing Page

Landing page estatica inspirada na referencia da Mega Model, com identidade adaptada para a marca Dilson Stein.

## Arquivos

- `index.html`: estrutura principal da landing page.
- `styles.css`: visual, animacoes, layout e responsividade.
- `script.js`: formulario, popup, WhatsApp, Supabase, CRM e tracking.
- `config.js`: arquivo local para configurar integracoes reais.
- `config.example.js`: modelo de configuracao.
- `supabase-schema.sql`: exemplo de tabela para receber os leads no Supabase.
- `meta-conversion-proxy.example.js`: exemplo de endpoint backend para Meta Conversions API.

## Como testar localmente

1. Ajuste o `config.js` com os valores publicos do projeto.
2. Defina a variavel de ambiente `META_ACCESS_TOKEN`.
3. Rode o servidor local:

```powershell
$env:META_ACCESS_TOKEN="SEU_TOKEN_AQUI"
node server.js
```

4. Abra `http://localhost:8080`.

## Deploy na Vercel

1. Suba este projeto para um repositorio Git.
2. Importe o repositorio na Vercel.
3. Configure a env var `META_ACCESS_TOKEN`.
4. Opcionalmente configure `META_PIXEL_ID` se quiser sobrescrever o valor padrao.
5. O endpoint `/api/facebook-conversion` sera publicado como Serverless Function.

## Integracoes previstas

### Supabase

- O formulario faz `POST` em `rest/v1/<table>`.
- Campos enviados: dados do lead, UTMs, `fbclid`, `fbc`, `fbp`, `user_agent` e `locale`.

### CRM privado

- O campo `crm.endpoint` recebe uma URL de webhook ou API privada.
- O script envia `lead` e `metadata` em JSON.

### Facebook Pixel e Conversions API

- `facebook.pixelId`: ativa automaticamente o `fbq`.
- `facebook.conversionProxyUrl`: endpoint proprio no backend para enviar o evento `Lead` com mais dados.

Importante: a Conversions API nao deve usar token secreto direto no navegador. O ideal e apontar para um endpoint seu.
