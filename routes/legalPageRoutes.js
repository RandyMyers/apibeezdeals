const express = require("express");
const legalPageController = require("../controllers/legalPageController");

const router = express.Router();

router.get("/pages/:slug", legalPageController.getBySlug);

module.exports = router;
