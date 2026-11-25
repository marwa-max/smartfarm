const pool = require("../config/db");

// Ligne SQL -> objet JSON attendu par Flutter
const formater = (r) => ({
  id: r.id,
  nom: r.nom,
  culture: r.culture,
  humidite: Number(r.humidite),
  seuil: Number(r.seuil),
  vanneOuverte: Boolean(r.vanne_ouverte),
  createdAt: r.created_at,
});

const estPourcentage = (v) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;

// Retourne un message d erreur, ou null si tout est valide
const valider = ({ nom, culture, humidite, seuil, vanneOuverte }) => {
  if (typeof nom !== "string" || nom.trim() === "") return "Le nom est obligatoire";
  if (nom.trim().length > 100) return "Le nom est trop long (100 caractères max)";
  if (typeof culture !== "string" || culture.trim() === "") return "La culture est obligatoire";
  if (culture.trim().length > 100) return "La culture est trop longue (100 caractères max)";
  if (!estPourcentage(humidite)) return "L'humidité doit être un nombre entre 0 et 100";
  if (!estPourcentage(seuil)) return "Le seuil doit être un nombre entre 0 et 100";
  if (typeof vanneOuverte !== "boolean") return "vanneOuverte doit être un booléen";
  return null;
};

// Valide et convertit le paramètre :id
const lireId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Identifiant de zone invalide" });
    return null;
  }
  return id;
};

const chargerZone = async (id, userId) => {
  const [rows] = await pool.query(
    "SELECT * FROM zones WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return rows[0];
};

// GET /api/zones
const getZones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM zones WHERE user_id = ? ORDER BY id",
      [req.user.id]
    );
    res.json(rows.map(formater));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /api/zones/:id
const getZoneById = async (req, res) => {
  const id = lireId(req, res);
  if (id === null) return;
  try {
    const zone = await chargerZone(id, req.user.id);
    if (!zone) return res.status(404).json({ message: "Zone introuvable" });
    res.json(formater(zone));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /api/zones
const createZone = async (req, res) => {
  const body = req.body || {};
  const data = {
    nom: body.nom,
    culture: body.culture,
    humidite: body.humidite ?? 50,
    seuil: body.seuil ?? 30,
    vanneOuverte: body.vanneOuverte ?? false,
  };

  const erreur = valider(data);
  if (erreur) return res.status(400).json({ message: erreur });

  try {
    const [result] = await pool.query(
      "INSERT INTO zones (user_id, nom, culture, humidite, seuil, vanne_ouverte) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, data.nom.trim(), data.culture.trim(), data.humidite, data.seuil, data.vanneOuverte ? 1 : 0]
    );
    const zone = await chargerZone(result.insertId, req.user.id);
    res.status(201).json(formater(zone));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ce nom de zone existe déjà" });
    }
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /api/zones/:id  (les champs absents gardent leur valeur actuelle)
const updateZone = async (req, res) => {
  const id = lireId(req, res);
  if (id === null) return;
  const body = req.body || {};

  try {
    const existante = await chargerZone(id, req.user.id);
    if (!existante) return res.status(404).json({ message: "Zone introuvable" });

    const data = {
      nom: body.nom ?? existante.nom,
      culture: body.culture ?? existante.culture,
      humidite: body.humidite ?? Number(existante.humidite),
      seuil: body.seuil ?? Number(existante.seuil),
      vanneOuverte: body.vanneOuverte ?? Boolean(existante.vanne_ouverte),
    };

    const erreur = valider(data);
    if (erreur) return res.status(400).json({ message: erreur });

    await pool.query(
      "UPDATE zones SET nom = ?, culture = ?, humidite = ?, seuil = ?, vanne_ouverte = ? WHERE id = ? AND user_id = ?",
      [data.nom.trim(), data.culture.trim(), data.humidite, data.seuil, data.vanneOuverte ? 1 : 0, id, req.user.id]
    );
    const zone = await chargerZone(id, req.user.id);
    res.json(formater(zone));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ce nom de zone existe déjà" });
    }
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /api/zones/:id
const deleteZone = async (req, res) => {
  const id = lireId(req, res);
  if (id === null) return;
  try {
    const [result] = await pool.query(
      "DELETE FROM zones WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Zone introuvable" });
    }
    res.json({ message: "Zone supprimée" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { getZones, getZoneById, createZone, updateZone, deleteZone };
