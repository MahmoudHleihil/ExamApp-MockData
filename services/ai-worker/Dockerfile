FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

# RUN addgroup -S appgroup \
#     && adduser -S appuser -G appgroup
RUN groupadd --system appgroup \
    && useradd \
        --system \
        --gid appgroup \
        --create-home \
        --home-dir /home/appuser \
        --shell /usr/sbin/nologin \
        appuser

COPY --from=dependencies \
  /app/node_modules \
  ./node_modules

COPY package.json ./
COPY src ./src

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["npm", "start"]