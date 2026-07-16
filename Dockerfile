FROM node:22-alpine AS build

WORKDIR /src

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm generate

FROM caddy:2.10-alpine

COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/.output/public /srv

EXPOSE 80
