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

# Port NestJS
EXPOSE 3000

# Mode dev avec hot reload
CMD ["npm", "run", "start:dev"]
