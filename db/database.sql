-- ============================================================================
--  SmartFarm / AgriSmart : base de donnees COMPLETE
--  = users.sql + zones.sql + donnees de demo.
--
--  Comment l'utiliser :
--    * MySQL Workbench : File > Open SQL Script > choisir ce fichier > cliquer sur l'eclair
--    * phpMyAdmin      : onglet "Importer" > choisir ce fichier > Executer
--    * Terminal        : mysql -u root -p   puis   SOURCE db/database.sql;
--
--  Le fichier peut etre relance sans risque (rien n'est ecrase ni duplique).
--  IMPORTANT : le nom de la base ci-dessous (smartfarm) doit etre le meme que
--  DB_NAME dans le fichier .env.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smartfarm
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartfarm;

-- ----------------------------------------------------------------------------
-- 1) Table users (module Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,   -- hash bcrypt (jamais le mot de passe en clair)
  nom        VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2) Table zones (module Zones - Khalil) : cle etrangere vers users(id),
--    nom unique par utilisateur, suppression en cascade avec l'utilisateur
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zones (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  nom           VARCHAR(100) NOT NULL,
  culture       VARCHAR(100) NOT NULL,
  humidite      DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  seuil         DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  vanne_ouverte TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_zones_user_nom (user_id, nom),
  CONSTRAINT fk_zones_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_zones_humidite CHECK (humidite BETWEEN 0 AND 100),
  CONSTRAINT chk_zones_seuil    CHECK (seuil BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3) DONNEES DE DEMO (optionnel : supprimer cette partie pour une base vide)
--    Compte de test :  khalil@test.tn  /  123456
--    (« Serre 1 - Oasis » est volontairement absente : la collection Postman la cree)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO users (email, password, nom) VALUES
  ('khalil@test.tn', '$2b$10$NJR8yr51tF0Q1oA.1fHb1.uC86XXCxj/k8s.7r9GkCUrNnU7xBRGq', 'Khalil Bahri');

INSERT IGNORE INTO zones (user_id, nom, culture, humidite, seuil, vanne_ouverte)
SELECT u.id, z.nom, z.culture, z.humidite, z.seuil, z.vanne_ouverte
FROM users u
JOIN (
  SELECT 'Serre 2 - Tomates' AS nom, 'Tomates'  AS culture, 65 AS humidite, 50 AS seuil, 0 AS vanne_ouverte
  UNION ALL SELECT 'Parcelle Nord', 'Legumes',  20, 45, 1
  UNION ALL SELECT 'Parcelle Sud',  'Cereales', 55, 30, 0
) z
WHERE u.email = 'khalil@test.tn';
