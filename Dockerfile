FROM node:20-alpine

# Dossier de travail
WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm install

# Code source
COPY . .

# Port NestJS
EXPOSE 3000

# Mode dev avec hot reload
CMD ["npm", "run", "start:dev"]
