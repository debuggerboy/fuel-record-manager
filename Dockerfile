FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
#COPY package.json ./
#RUN bun install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DB_FILE_NAME=/app/data/fuel-records.db

RUN mkdir -p /app/data && chown -R bun:bun /app
COPY --from=build --chown=bun:bun /app/.output ./.output
COPY --from=build --chown=bun:bun /app/package.json ./package.json

USER bun
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
