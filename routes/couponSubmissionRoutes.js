const express = require("express");
const couponSubmissionController = require("../controllers/couponSubmissionController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, couponSubmissionController.create);

module.exports = router;
