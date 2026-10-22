FROM node:20-bookworm-slim

# Dossier de travail
WORKDIR /app

# Dépendances
COPY package*.json ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Code source
COPY . .
RUN npm run build

# Configuration d'execution
ENV NODE_ENV=production

# Port local par defaut. Render fournit dynamiquement PORT au demarrage.
EXPOSE 3000

# Demarrage du JavaScript deja compile, sans watcher de developpement.
CMD ["npm", "run", "start:prod"]
