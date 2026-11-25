# SmartFarm / AgriSmart — Backend

API Node.js + Express + MySQL du projet AgriSmart (mini-projet Flutter, ISET Kébili).

## Démarrage rapide

**1. Base de données** — exécuter une seule fois le fichier `db/database.sql` (il crée la base `smartfarm`, les tables `users` et `zones`, et un compte de démo) :

- MySQL Workbench : *File > Open SQL Script* → choisir `db/database.sql` → cliquer sur l'éclair ⚡
- phpMyAdmin : onglet *Importer* → choisir `db/database.sql` → *Exécuter*
- Terminal : `mysql -u root -p` puis `SOURCE db/database.sql;`

**2. Configuration** — copier `.env.example` en `.env` puis renseigner `DB_PASSWORD` (mot de passe MySQL) et `JWT_SECRET`.
`DB_NAME` doit rester égal au nom de la base créée par `database.sql` (`smartfarm`).

**3. Lancer le serveur**

```bash
npm install
npm run dev
```

Test : ouvrir <http://localhost:3000/test-db> → « Connexion MySQL réussie ✅ ».

**Compte de démo** (créé par `database.sql`) : `khalil@test.tn` / `123456`

## Structure

```
config/db.js              connexion MySQL (pool)
middleware/auth.js        protect : vérifie le token JWT
controllers/              auth.controller.js, zones.controller.js
routes/                   auth.routes.js, zones.routes.js
db/                       database.sql (complet), users.sql, zones.sql
docs/postman/             collection Postman du module Zones
flutter_zones/            fichiers Flutter du module Zones (voir flutter_zones/README.md)
```

`db/database.sql` = `users.sql` + `zones.sql` + données de démo. Les fichiers séparés servent à ajouter une seule table sur une base existante.

## Routes

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription (email, password, nom) |
| POST | `/api/auth/login` | Connexion → renvoie le token JWT |
| GET / POST / PUT / DELETE | `/api/zones...` | Module Zones (voir ci-dessous) |

### Module Zones (Khalil Bahri)

Gestion des zones d'irrigation d'un utilisateur : création, consultation, modification et suppression.
Chaque utilisateur ne voit que ses propres zones.

**Base de données** : table `zones` (`db/zones.sql`), clé étrangère vers `users(id)`, nom unique par utilisateur.

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/zones` | Liste des zones de l'utilisateur | 200 |
| GET | `/api/zones/:id` | Détail d'une zone | 200, 400, 404 |
| POST | `/api/zones` | Créer une zone | 201, 400, 409 |
| PUT | `/api/zones/:id` | Modifier une zone (champs partiels acceptés) | 200, 400, 404, 409 |
| DELETE | `/api/zones/:id` | Supprimer une zone | 200, 400, 404 |

Toutes les routes exigent l'en-tête `Authorization: Bearer <token>` (token obtenu avec `/api/auth/login`).
Collection Postman : `docs/postman/zones.postman_collection.json` (importer dans Postman, lancer d'abord « 0. Login »).

**Flutter** : `ZonesService` (appels API), `ZonesProvider` (états chargement / erreur / retry), `ZonesPage` — fichiers dans `flutter_zones/`.
