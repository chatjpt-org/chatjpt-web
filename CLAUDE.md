# chatJPT Web: diretrizes de integracao

O frontend e uma SPA Nuxt 4 estatica (`ssr: false`) que conversa somente com a
API Go por caminhos relativos iniciados em `/api`.

## Regras de seguranca

- Nunca adicione Cloudflare Access Client ID, Client Secret, token de tunnel,
  token do Ollama ou segredo de banco ao repositorio ou bundle do navegador.
- O browser autentica por cookie `HttpOnly` da API. Use `credentials: 'include'`.
- Nao chame o gateway de IA, Ollama ou `ai.devarthur.com.br` a partir do cliente.
- O Caddy em `infra/Caddyfile` encaminha `/api/*` ao hostname privado
  `chatjpt-api:8080` da rede Docker `jchat`.

## Contrato usado

- `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/session`
- CRUD em `/v1/conversations`
- `GET` e `POST /v1/conversations/{id}/messages`
- O `POST` de mensagens entrega SSE com `data: {"delta":"..."}` e termina
  com `data: [DONE]`. Erros de modelo chegam como `data: {"error": ...}`.

`app/services/jchat-api.ts` concentra o protocolo. Componentes nao devem usar
`fetch` diretamente.

## Validacao obrigatoria

```bash
pnpm lint
pnpm test
pnpm generate
```

Para publicacao, o CI deve passar e o deploy ocorre por pull request para
`main`; nao empurre diretamente para a branch protegida.
