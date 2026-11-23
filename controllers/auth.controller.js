const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const generateToken = require('../utils/generateToken');

// Register
const register = async (req, res) => {
  const { email, password, nom } = req.body;

  if (!email || !password || !nom) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }

  try {
    // Vérifier si l'email existe déjà
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insérer l'utilisateur
    const [result] = await pool.query(
      'INSERT INTO users (email, password, nom) VALUES (?, ?, ?)',
      [email, hashedPassword, nom]
    );

    const user = {
      id: result.insertId,
      email,
      nom,
      token: generateToken(result.insertId),
    };

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe obligatoires' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    res.json({
      id: user.id,
      email: user.email,
      nom: user.nom,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { register, login };