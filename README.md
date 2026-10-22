# IdeaBox personnel

API NestJS/TypeORM utilisant SQLite. Le frontend statique se trouve dans le dossier voisin `ideabox front`.

## Configuration locale

Copier `.env.example` vers `.env`, puis remplacer les valeurs d'exemple. Ne jamais versionner `.env`.

Variables principales :

- `IDEABOX_DB_PATH` : chemin du fichier SQLite ;
- `AUTH_JWT_SECRET` : secret aléatoire long utilisé pour signer les jetons ;
- `AUTH_TOKEN_TTL_SECONDS` : durée du jeton court (3600 par défaut) ;
- `CORS_ORIGINS` : origines frontend autorisées, séparées par des virgules ;
- `OWNER_EMAIL` et `OWNER_PASSWORD` : utilisés uniquement par la commande d'initialisation du propriétaire.

## Initialisation et lancement

```powershell
npm.cmd install
npm.cmd run migration:run
npm.cmd run owner:init
npm.cmd run start:dev
```

La commande `owner:init` crée le compte unique, ou renouvelle son mot de passe si le même compte existe. Elle rattache également au propriétaire les données importées avant sa création.

Servir ensuite `ideabox front` sur `http://localhost:8081`. Par défaut, le frontend contacte l'API locale sur `http://localhost:3001`. Pour un autre environnement, définir `window.IDEABOX_CONFIG.apiUrl` avant le chargement de `config.js`.

## Docker Compose

Créer `ideabox/.env` à partir de `.env.example` et remplacer au minimum `AUTH_JWT_SECRET` par une valeur aléatoire longue. Le port hôte de l'API est `3001` par défaut afin de ne pas entrer en conflit avec une autre application utilisant le port 3000.

```powershell
docker compose up -d --build
docker compose exec api npm run migration:run
docker compose exec api npm run owner:init
```

Le port reste `3000` dans le conteneur. Pour choisir un autre port hôte, définir `IDEABOX_API_PORT` dans `.env` et aligner `window.IDEABOX_CONFIG.apiUrl` côté frontend.

## Import initial destructif local

Cette commande sauvegarde d'abord le fichier SQLite dans `db/backups/`, conserve le compte propriétaire, puis remplace transactionnellement les seules données métier :

```powershell
$env:CONFIRM_LOCAL_RESET='RESET_IDEABOX_LOCAL'
npm.cmd run data:reset-import
```

Elle refuse de s'exécuter avec `NODE_ENV=production` et ne se lance jamais automatiquement.

## Hébergement avec persistance

Monter un volume persistant sur le dossier contenant `IDEABOX_DB_PATH`, fournir les secrets par l'environnement, définir `CORS_ORIGINS` avec l'origine HTTPS réelle et exécuter les migrations explicitement avant le démarrage. Une seule instance d'API écrivant dans SQLite est recommandée. Le dépôt ne déploie ni serveur ni synchronisation distante.
