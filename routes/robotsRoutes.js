const express = require('express');
const router = express.Router();
const robotsController = require('../controllers/robotsController');

router.get('/robots.txt', robotsController.getRobotsTxt);

module.exports = router;
