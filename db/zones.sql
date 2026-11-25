-- Module Zones (Khalil) : table des zones d'irrigation
-- A executer APRES db/users.sql (cle etrangere vers users.id)
-- mysql -u root -p NOM_DE_LA_BASE < db/zones.sql

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

-- Donnees de demo (optionnel) : remplacer 1 par l'id d'un utilisateur existant
-- INSERT INTO zones (user_id, nom, culture, humidite, seuil, vanne_ouverte) VALUES
--   (1, "Serre 1 - Oasis",   "Palmiers dattiers", 35, 40, 1),
--   (1, "Serre 2 - Tomates", "Tomates",           65, 50, 0),
--   (1, "Parcelle Nord",     "Legumes",           20, 45, 1),
--   (1, "Parcelle Sud",      "Cereales",          55, 30, 0);
