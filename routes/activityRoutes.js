const express = require("express");
const activityController = require("../controllers/activityController");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/log", optionalAuth, activityController.log);

module.exports = router;
