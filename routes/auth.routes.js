const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);

// Routes protégées (nécessitent le header Authorization: Bearer <token>)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, updatePassword);

module.exports = router;
