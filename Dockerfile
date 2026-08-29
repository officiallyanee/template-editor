FROM node:22.23.2-alpine3.23 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM node:22.23.2-alpine3.23 AS runtime

WORKDIR /app
RUN npm install --global serve@14.2.6 && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000", "--no-clipboard"]
