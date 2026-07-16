# chatJPT Web

Cliente web estatico do chatJPT. O navegador autentica usuarios na API Go e
recebe respostas em streaming SSE. Ele nao acessa Ollama, Cloudflare Access ou
o gateway de IA diretamente.

## Arquitetura

```text
Browser
  -> https://jchat.devarthur.com.br
  -> Caddy (container chatjpt-web)
     -> /api/* -> chatjpt-api:8080, rede Docker privada jchat
        -> Cloudflare Access -> gateway no home server -> Ollama
```

O Caddy remove o prefixo `/api` antes de encaminhar a requisicao. Assim, o
navegador usa a mesma origem, o cookie `HttpOnly` da sessao nao precisa ser
exposto ao JavaScript e nao ha configuracao de CORS para manter.

O modelo exibido na interface corresponde ao modelo atualmente fixado pela API:
`qwen2.5:1.5b-instruct`. A troca de modelo e uma decisao do backend/gateway;
nao deve ser simulada no cliente.

## Desenvolvimento

Requisitos: Node.js 22+ e pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

O cliente solicita a API em `/api`. Para testar a integracao real localmente,
sirva o build pelo Caddy deste repositorio na mesma rede Docker em que a API
esta disponivel. Nunca configure Client ID, Client Secret ou qualquer token do
Cloudflare no frontend.

## Verificacao

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm generate
docker build --tag chatjpt-web:local .
```

Os testes unitarios cobrem a store contra o contrato HTTP/SSE. O teste E2E
intercepta `/api` para validar a interface sem depender de credenciais reais.

## Deploy na KVM2

O `compose.yaml` expoe somente `127.0.0.1:8085`. O Cloudflare Tunnel e o unico
componente que publica o dominio, apontando `jchat.devarthur.com.br` para
`http://localhost:8085` na KVM2.

O workflow `deploy.yml` usa SSH pelo Cloudflare Access e so executa quando a
repository variable `DEPLOY_ENABLED` for `true`. Ele exige o secret
`KVM2_DEPLOY_SSH_PRIVATE_KEY`, instala o repositorio em `/opt/chatjpt-web` e
faz `docker compose up -d --build`.

Antes do primeiro deploy, a rede Docker externa `jchat` precisa existir e a API
`chatjpt-api` precisa estar conectada a ela. O container web resolve a API pelo
hostname Docker `chatjpt-api`, sem porta publica da API.
