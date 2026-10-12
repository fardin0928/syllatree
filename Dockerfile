# chill335: Next.js app + C++ judge (needs a compiler at runtime)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
# clang++ for the judge; libclang-rt for -fsanitize=address problems
RUN apt-get update \
 && apt-get install -y --no-install-recommends clang libc++-dev libc++abi-dev libclang-rt-dev \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 CXX=clang++
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# problems are read from disk at request time; mount a volume over /app/problems to edit live
COPY problems ./problems
EXPOSE 3000
CMD ["node", "server.js"]
