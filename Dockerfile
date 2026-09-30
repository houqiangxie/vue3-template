# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_baseUrl=/api
ARG VITE_BUILD_URL=/
ARG VITE_BPM_API_PREFIX=/jgzf-flowable
ARG VITE_WS_URL=
ARG VITE_ALLOW_QUERY_TOKEN=
ARG VITE_LOGIN_AES_KEY=
ARG VITE_LOGIN_AES_IV=
ARG VITE_ENABLE_I18N=

ENV VITE_baseUrl=${VITE_baseUrl}
ENV VITE_BUILD_URL=${VITE_BUILD_URL}
ENV VITE_BPM_API_PREFIX=${VITE_BPM_API_PREFIX}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_ALLOW_QUERY_TOKEN=${VITE_ALLOW_QUERY_TOKEN}
ENV VITE_LOGIN_AES_KEY=${VITE_LOGIN_AES_KEY}
ENV VITE_LOGIN_AES_IV=${VITE_LOGIN_AES_IV}
ENV VITE_ENABLE_I18N=${VITE_ENABLE_I18N}

RUN pnpm build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
