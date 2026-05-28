const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

router.get("/suggestions", searchController.suggestions);
router.get("/trending", searchController.trending);

module.exports = router;
