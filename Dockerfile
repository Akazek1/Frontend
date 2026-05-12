FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM base AS development

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM base AS production-build

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=production-build /app/public ./public
COPY --from=production-build /app/.next/standalone ./
COPY --from=production-build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
