FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup \
    && apk add --no-cache su-exec

COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

RUN mkdir -p \
      /app/uploads/course-materials \
      /app/outputs \
    && chown -R appuser:appgroup /app \
    && chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]

EXPOSE 5000

CMD ["node", "server.js"]