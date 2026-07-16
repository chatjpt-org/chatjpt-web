# Web Client Operations

## Production topology

- Public URL: `https://jchat.devarthur.com.br`
- KVM2 repository path: `/opt/chatjpt-web`
- Web container: `chatjpt-web-web-1`
- Local host binding: `127.0.0.1:8086`
- Docker network: external network `jchat`
- API upstream name: `chatjpt-api:8080`
- Cloudflare Tunnel configuration: `/etc/cloudflared/config.yml`

The tunnel maps `jchat.devarthur.com.br` to `http://localhost:8086`. Caddy
serves the generated Nuxt files and removes the `/api` prefix before proxying
to the private API container. The browser never connects to the AI gateway.

## Authentication and AI boundaries

- The web client uses the API session cookie with `credentials: 'include'`.
- Browser code contains no Cloudflare Access service token, gateway credential,
  Ollama address, or database secret.
- The Go API owns the Cloudflare Access service token for the home AI gateway.
- The current API model is `qwen2.5:1.5b-instruct`; model selection is not a
  client-side setting.

## CI/CD

`main` is protected. Merges require a pull request and successful `quality`
and `container` checks. The CI runs lint, unit tests, static generation, and a
Linux Docker image build.

The Deploy workflow is enabled by the repository variable `DEPLOY_ENABLED=true`.
It uses `KVM2_DEPLOY_SSH_PRIVATE_KEY`, connects through
`ssh.devarthur.com.br`, updates `/opt/chatjpt-web`, and runs Docker Compose.

## Verified on 2026-07-16

- GitHub Actions CI passed after the real API integration.
- GitHub Actions deployment passed.
- The web container reported `healthy` on KVM2.
- `https://jchat.devarthur.com.br/` returned HTTP 200 through Cloudflare.
- `https://jchat.devarthur.com.br/api/v1/auth/session` returned the API JSON
  HTTP 401 response when no session cookie was supplied. This confirms the
  production reverse proxy reaches the API instead of the SPA fallback.

## Remaining browser check

Sign in at `https://jchat.devarthur.com.br` with the administrator-created
account and send one message. This is the final manual confirmation because the
password is intentionally unavailable to automation.
