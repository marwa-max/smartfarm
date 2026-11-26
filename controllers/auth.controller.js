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
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

// GET /me : Récupérer le profil de l'utilisateur connecté
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, nom, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /me : Modifier nom et/ou email
const updateMe = async (req, res) => {
  const { nom, email } = req.body;

  if (!nom || !email) {
    return res.status(400).json({ message: 'Le nom et l’email sont obligatoires' });
  }

  try {
    // Vérifier si l'email est déjà pris par un autre utilisateur
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte' });
    }

    await pool.query(
      'UPDATE users SET nom = ?, email = ? WHERE id = ?',
      [nom, email, req.user.id]
    );

    res.json({
      id: req.user.id,
      nom,
      email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /me/password : Changer le mot de passe
const updatePassword = async (req, res) => {
  const { ancienPassword, nouveauPassword } = req.body;

  if (!ancienPassword || !nouveauPassword) {
    return res.status(400).json({ message: 'Ancien et nouveau mot de passe obligatoires' });
  }

  if (nouveauPassword.length < 6) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(ancienPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nouveauPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { register, login, getMe, updateMe, updatePassword };
