const pool = require('../config/db');

exports.addMesure = async (req, res) => {
  try {
    const { humidite, temperature } = req.body;
    await pool.query(
      'INSERT INTO mesures (zone_id, humidite, temperature) VALUES (?, ?, ?)',
      [req.params.id, humidite, temperature]
    );
    res.status(201).json({ message: 'Mesure ajoutée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMesures = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM mesures WHERE zone_id = ? ORDER BY date_mesure DESC LIMIT 50',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resume = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS nb_mesures,
              AVG(humidite) AS humidite_moy,
              AVG(temperature) AS temperature_moy
       FROM mesures`
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.parZone = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT zone_id,
              AVG(humidite) AS humidite_moy,
              AVG(temperature) AS temperature_moy,
              COUNT(*) AS nb_mesures
       FROM mesures GROUP BY zone_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};