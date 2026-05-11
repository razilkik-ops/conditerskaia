FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY public ./public
COPY src ./src
COPY scripts ./scripts

RUN chmod +x /app/scripts/docker-entrypoint.sh

EXPOSE 3000

CMD ["./scripts/docker-entrypoint.sh"]
