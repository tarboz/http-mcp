ARG PORT='8080'

FROM node:22.6-slim AS builder

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

COPY --chown=node:node --exclude=.git* --exclude=.DS* . .

RUN [ -f package-lock.json ] && npm ci --prefer-offline || npm install

USER node

RUN ["npm", "run", "build", "--ws"]

FROM cgr.dev/chainguard/node AS runner

ARG PORT

COPY --from=builder /usr/src/app/dist/*.js /usr/src/app/
COPY --from=builder /usr/src/app/node_modules/common /usr/src/app/node_modules/common/

WORKDIR /usr/src/app

CMD ["--env-file-if-exists", "config.env", "mcp-server"]

EXPOSE $PORT/tcp