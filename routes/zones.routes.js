const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
} = require("../controllers/zones.controller");

// Toutes les routes zones exigent un token JWT valide
router.use(protect);

router.get("/", getZones);
router.get("/:id", getZoneById);
router.post("/", createZone);
router.put("/:id", updateZone);
router.delete("/:id", deleteZone);

module.exports = router;
