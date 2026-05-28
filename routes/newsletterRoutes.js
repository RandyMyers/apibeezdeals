const express = require("express");
const publicFormsController = require("../controllers/publicFormsController");

const router = express.Router();

router.post("/subscribe", publicFormsController.subscribeNewsletter);

module.exports = router;
