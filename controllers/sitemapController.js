/**
 * Sitemap Controller
 */

const {
  generateSitemap,
  generateSitemapIndex,
  generateImageSitemap,
  generateNewsSitemap,
} = require('../utils/sitemapGenerator');
const { resolvePublicSiteUrl } = require('../utils/siteUrl');
const Coupon = require('../models/Coupon');
const Store = require('../models/Store');
const Category = require('../models/Category');
const BlogPost = require('../models/BlogPost');
const SEOSettings = require('../models/SEOSettings');

const models = { Coupon, Store, Category, BlogPost };

async function loadSeoContext(req) {
  const settings = await SEOSettings.getSettings();
  const baseUrl = (settings.siteUrl || resolvePublicSiteUrl(req)).replace(/\/$/, '');
  return { settings, baseUrl };
}

exports.getSitemap = async (req, res) => {
  try {
    const { settings, baseUrl } = await loadSeoContext(req);
    if (settings.sitemap?.enabled === false) {
      return res.status(404).json({ error: 'Sitemap disabled' });
    }
    const sitemap = await generateSitemap(models, baseUrl, {
      sitemap: settings.sitemap,
    });

    if (settings.searchConsole?.autoSubmitSitemap) {
      const { notifySitemapUpdated } = require('../utils/sitemapPing');
      const indexKey = process.env.INDEXNOW_API_KEY || settings.indexNow?.apiKey;
      notifySitemapUpdated(baseUrl, { indexNowKey: indexKey }).catch(() => {});
      SEOSettings.updateOne(
        {},
        { $set: { 'searchConsole.lastSitemapPingAt': new Date() } }
      ).catch(() => {});
    }

    res.set('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap', message: error.message });
  }
};

exports.getSitemapIndex = async (req, res) => {
  try {
    const { baseUrl } = await loadSeoContext(req);
    const sitemaps = [
      { path: '/sitemap.xml', lastmod: new Date().toISOString() },
      { path: '/sitemap-images.xml', lastmod: new Date().toISOString() },
      { path: '/sitemap-news.xml', lastmod: new Date().toISOString() },
    ];
    const sitemapIndex = generateSitemapIndex(sitemaps, baseUrl);
    res.set('Content-Type', 'application/xml');
    res.status(200).send(sitemapIndex);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).json({ error: 'Failed to generate sitemap index', message: error.message });
  }
};

exports.getImageSitemap = async (req, res) => {
  try {
    const { settings, baseUrl } = await loadSeoContext(req);
    const sitemap = await generateImageSitemap(models, baseUrl, {
      sitemap: settings.sitemap,
    });
    res.set('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    res.status(500).json({ error: 'Failed to generate image sitemap', message: error.message });
  }
};

exports.getSlugs = async (req, res) => {
  try {
    const settings = await SEOSettings.getSettings();
    const cutoff = new Date();
    const sm = settings.sitemap || {};
    const tasks = [];

    if (sm.includeStores !== false) {
      tasks.push(
        Store.find({ isPublished: { $ne: false } })
          .select('slug updatedAt contentUpdatedAt')
          .limit(10000)
          .lean()
          .then((rows) => ({
            key: 'stores',
            data: rows.map((s) => ({
              slug: s.slug,
              updatedAt: s.contentUpdatedAt || s.updatedAt,
            })),
          }))
      );
    } else tasks.push(Promise.resolve({ key: 'stores', data: [] }));

    if (sm.includeCoupons !== false) {
      tasks.push(
        Coupon.find({ isPublished: true })
          .select('publicId updatedAt expiresAt')
          .limit(10000)
          .lean()
          .then((rows) => ({
            key: 'coupons',
            data: rows
              .filter((c) => !c.expiresAt || new Date(c.expiresAt) >= cutoff)
              .map((c) => ({ slug: c.publicId, updatedAt: c.updatedAt })),
          }))
      );
    } else tasks.push(Promise.resolve({ key: 'coupons', data: [] }));

    if (sm.includeCategories !== false) {
      tasks.push(
        Category.find({})
          .select('slug updatedAt')
          .limit(1000)
          .lean()
          .then((rows) => ({
            key: 'categories',
            data: rows.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),
          }))
      );
    } else tasks.push(Promise.resolve({ key: 'categories', data: [] }));

    if (sm.includeBlogs !== false) {
      tasks.push(
        BlogPost.find({ isPublished: true })
          .select('slug updatedAt publishedAt')
          .limit(5000)
          .lean()
          .then((rows) => ({
            key: 'blogs',
            data: rows.map((b) => ({
              slug: b.slug,
              updatedAt: b.updatedAt || b.publishedAt,
            })),
          }))
      );
    } else tasks.push(Promise.resolve({ key: 'blogs', data: [] }));

    const parts = await Promise.all(tasks);
    const body = { stores: [], coupons: [], categories: [], blogs: [] };
    parts.forEach(({ key, data }) => {
      body[key] = data;
    });
    res.status(200).json(body);
  } catch (error) {
    console.error('Error fetching sitemap slugs:', error);
    res.status(500).json({ error: 'Failed to fetch sitemap slugs', message: error.message });
  }
};

exports.getNewsSitemap = async (req, res) => {
  try {
    const { baseUrl } = await loadSeoContext(req);
    const sitemap = await generateNewsSitemap(BlogPost, baseUrl);
    res.set('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    res.status(500).json({ error: 'Failed to generate news sitemap', message: error.message });
  }
};
