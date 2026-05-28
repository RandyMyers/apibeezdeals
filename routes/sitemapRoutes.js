const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

router.get('/sitemap.xml', sitemapController.getSitemap);
router.get('/sitemap-index.xml', sitemapController.getSitemapIndex);
router.get('/sitemap-images.xml', sitemapController.getImageSitemap);
router.get('/sitemap-news.xml', sitemapController.getNewsSitemap);

module.exports = router;
