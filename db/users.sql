-- Table des utilisateurs (inscription / connexion : controllers/auth.controller.js)
-- Colonnes deduites du code : email, password (hash bcrypt), nom.
-- A executer AVANT db/zones.sql (zones.user_id pointe vers users.id).
-- NB : users.id doit rester de type INT, comme zones.user_id.

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,   -- hash bcrypt (jamais le mot de passe en clair)
  nom        VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
