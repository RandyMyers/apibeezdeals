/**
 * Robots.txt Controller
 */

const SEOSettings = require('../models/SEOSettings');
const { generateRobotsTxt, getDefaultRobotsConfig } = require('../utils/robotsGenerator');
const { resolvePublicSiteUrl } = require('../utils/siteUrl');

exports.getRobotsTxt = async (req, res) => {
  try {
    const settings = await SEOSettings.getSettings();
    const baseUrl = (settings.siteUrl || resolvePublicSiteUrl(req)).replace(/\/$/, '');
    const config = getDefaultRobotsConfig();
    if (settings.robotsTxt) {
      if (settings.robotsTxt.allowAll !== undefined) config.allowAll = settings.robotsTxt.allowAll;
      if (settings.robotsTxt.disallowPaths?.length) {
        config.disallowPaths = settings.robotsTxt.disallowPaths;
      }
      if (settings.robotsTxt.crawlDelay) config.crawlDelay = settings.robotsTxt.crawlDelay;
    }
    config.baseUrl = baseUrl;
    config.sitemapUrls = [
      `${baseUrl}/sitemap-index.xml`,
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-images.xml`,
      `${baseUrl}/sitemap-news.xml`,
    ];
    const robotsTxt = generateRobotsTxt(config);
    res.set('Content-Type', 'text/plain');
    res.status(200).send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).json({ error: 'Failed to generate robots.txt', message: error.message });
  }
};
