const router = require('express').Router();
const c = require('../controllers/mesures.controller');

router.post('/zones/:id/mesures', c.addMesure);
router.get('/zones/:id/mesures', c.getMesures);
router.get('/stats/resume', c.resume);
router.get('/stats/par-zone', c.parZone);

module.exports = router;