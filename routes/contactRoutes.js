const express = require("express");
const publicFormsController = require("../controllers/publicFormsController");

const router = express.Router();

router.post("/", publicFormsController.submitContact);

module.exports = router;
