/**
 * XML Sitemap Generator (DealBeez) — hreflang clusters + multilingual URLs
 */

const xmlbuilder = require("xmlbuilder");
const {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  absoluteLanguageUrl,
} = require("./sitemapLanguages");

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/coupons", priority: "0.9", changefreq: "daily" },
  { path: "/stores", priority: "0.9", changefreq: "daily" },
  { path: "/categories", priority: "0.8", changefreq: "weekly" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/contact", priority: "0.7", changefreq: "monthly" },
  { path: "/faq", priority: "0.7", changefreq: "weekly" },
  { path: "/blog", priority: "0.8", changefreq: "daily" },
  { path: "/privacy", priority: "0.5", changefreq: "yearly" },
  { path: "/terms", priority: "0.5", changefreq: "yearly" },
];

function toIso(date) {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
}

function addHreflangLinks(urlElement, path, baseUrl) {
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const link = urlElement.ele("xhtml:link");
    link.att("rel", "alternate");
    link.att("hreflang", lang.locale || lang.code);
    link.att("href", absoluteLanguageUrl(baseUrl, path, lang.code));
  });
  const xDefault = urlElement.ele("xhtml:link");
  xDefault.att("rel", "alternate");
  xDefault.att("hreflang", "x-default");
  xDefault.att("href", absoluteLanguageUrl(baseUrl, path, DEFAULT_LANGUAGE));
}

function appendUrl(root, baseUrl, entry) {
  const { path, lastmod, changefreq, priority } = entry;
  const url = root.ele("url");
  url.ele("loc", absoluteLanguageUrl(baseUrl, path, DEFAULT_LANGUAGE));
  url.ele("lastmod", toIso(lastmod));
  if (changefreq) url.ele("changefreq", changefreq);
  if (priority) url.ele("priority", priority);
  addHreflangLinks(url, path, baseUrl);
}

const generateSitemap = async (models, baseUrl = "https://coupondealz.com", options = {}) => {
  const sm = options.sitemap || {};
  const includeStores = sm.includeStores !== false;
  const includeCoupons = sm.includeCoupons !== false;
  const includeCategories = sm.includeCategories !== false;
  const includeBlogs = sm.includeBlogs !== false;
  const root = xmlbuilder
    .create("urlset", { version: "1.0", encoding: "UTF-8" })
    .att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    .att("xmlns:xhtml", "http://www.w3.org/1999/xhtml")
    .att("xmlns:image", "http://www.google.com/schemas/sitemap-image/1.1");

  const now = new Date();

  STATIC_PAGES.forEach((page) => {
    appendUrl(root, baseUrl, { ...page, lastmod: now });
  });

  try {
    if (models.Coupon && includeCoupons) {
      const coupons = await models.Coupon.find({ isPublished: true })
        .select("publicId updatedAt expiresAt")
        .limit(10000)
        .lean();
      const cutoff = new Date();
      coupons.forEach((coupon) => {
        if (coupon.expiresAt && new Date(coupon.expiresAt) < cutoff) return;
        const id = coupon.publicId || coupon._id;
        appendUrl(root, baseUrl, {
          path: `/coupon/${id}`,
          lastmod: coupon.updatedAt,
          changefreq: "weekly",
          priority: "0.8",
        });
      });
    }

    if (models.Store && includeStores) {
      const stores = await models.Store.find({ isPublished: { $ne: false } })
        .select("slug updatedAt contentUpdatedAt")
        .limit(10000)
        .lean();
      stores.forEach((store) => {
        appendUrl(root, baseUrl, {
          path: `/store/${store.slug || store._id}`,
          lastmod: store.contentUpdatedAt || store.updatedAt,
          changefreq: "weekly",
          priority: "0.8",
        });
      });
    }

    if (models.Category && includeCategories) {
      const categories = await models.Category.find({})
        .select("slug updatedAt")
        .limit(1000)
        .lean();
      categories.forEach((category) => {
        appendUrl(root, baseUrl, {
          path: `/category/${category.slug || category._id}`,
          lastmod: category.updatedAt,
          changefreq: "weekly",
          priority: "0.7",
        });
      });
    }

    if (models.BlogPost && includeBlogs) {
      const posts = await models.BlogPost.find({ isPublished: true })
        .select("slug updatedAt publishedAt")
        .limit(5000)
        .lean();
      posts.forEach((post) => {
        appendUrl(root, baseUrl, {
          path: `/blog/${post.slug}`,
          lastmod: post.updatedAt || post.publishedAt,
          changefreq: "weekly",
          priority: "0.7",
        });
      });
    }
  } catch (error) {
    console.error("Error generating dynamic sitemap entries:", error);
  }

  return root.end({ pretty: true });
};

const generateSitemapIndex = (sitemaps, baseUrl = "https://coupondealz.com") => {
  const root = xmlbuilder
    .create("sitemapindex", { version: "1.0", encoding: "UTF-8" })
    .att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
  sitemaps.forEach((sitemap) => {
    const el = root.ele("sitemap");
    el.ele("loc", `${String(baseUrl).replace(/\/$/, "")}${sitemap.path}`);
    el.ele("lastmod", sitemap.lastmod || new Date().toISOString());
  });
  return root.end({ pretty: true });
};

const generateImageSitemap = async (models, baseUrl = "https://coupondealz.com", options = {}) => {
  const sm = options.sitemap || {};
  const root = xmlbuilder
    .create("urlset", { version: "1.0", encoding: "UTF-8" })
    .att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    .att("xmlns:image", "http://www.google.com/schemas/sitemap-image/1.1");

  const pageUrl = (path) => absoluteLanguageUrl(baseUrl, path, DEFAULT_LANGUAGE);

  try {
    if (models.Store && sm.includeStores !== false) {
      const stores = await models.Store.find({
        isPublished: { $ne: false },
        logo: { $exists: true, $ne: "" },
      })
        .select("slug logo updatedAt contentUpdatedAt")
        .limit(10000)
        .lean();
      stores.forEach((store) => {
        if (!store.logo) return;
        const url = root.ele("url");
        url.ele("loc", pageUrl(`/store/${store.slug || store._id}`));
        url.ele("lastmod", toIso(store.contentUpdatedAt || store.updatedAt));
        const image = url.ele("image:image");
        image.ele("image:loc", store.logo);
      });
    }

    if (models.Coupon && sm.includeCoupons !== false) {
      const coupons = await models.Coupon.find({
        isPublished: true,
        productImage: { $exists: true, $ne: "" },
      })
        .select("publicId productImage updatedAt")
        .limit(10000)
        .lean();
      coupons.forEach((coupon) => {
        if (!coupon.productImage) return;
        const id = coupon.publicId || coupon._id;
        const url = root.ele("url");
        url.ele("loc", pageUrl(`/coupon/${id}`));
        url.ele("lastmod", toIso(coupon.updatedAt));
        const image = url.ele("image:image");
        image.ele("image:loc", coupon.productImage);
      });
    }

    if (models.BlogPost && sm.includeBlogs !== false) {
      const posts = await models.BlogPost.find({
        isPublished: true,
        featuredImage: { $exists: true, $ne: "" },
      })
        .select("slug featuredImage updatedAt publishedAt")
        .limit(5000)
        .lean();
      posts.forEach((post) => {
        if (!post.featuredImage) return;
        const url = root.ele("url");
        url.ele("loc", pageUrl(`/blog/${post.slug}`));
        url.ele("lastmod", toIso(post.updatedAt || post.publishedAt));
        const image = url.ele("image:image");
        image.ele("image:loc", post.featuredImage);
      });
    }
  } catch (error) {
    console.error("Error generating image sitemap entries:", error);
  }

  return root.end({ pretty: true });
};

const NEWS_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const MAX_NEWS_URLS = 1000;

const generateNewsSitemap = async (BlogPost, baseUrl = "https://coupondealz.com") => {
  const publicationName = process.env.NEWS_PUBLICATION_NAME || "DealBeez";
  const publicationLang = process.env.NEWS_PUBLICATION_LANGUAGE || "en";

  const root = xmlbuilder
    .create("urlset", { version: "1.0", encoding: "UTF-8" })
    .att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    .att("xmlns:news", "http://www.google.com/schemas/sitemap-news/0.9");

  if (!BlogPost) return root.end({ pretty: true });

  try {
    const cutoff = new Date(Date.now() - NEWS_WINDOW_MS);
    const posts = await BlogPost.find({
      isPublished: true,
      publishedAt: { $gte: cutoff },
    })
      .sort({ publishedAt: -1 })
      .limit(MAX_NEWS_URLS)
      .select("slug title publishedAt")
      .lean();

    posts.forEach((post) => {
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : new Date().toISOString();
      const url = root.ele("url");
      url.ele(
        "loc",
        absoluteLanguageUrl(baseUrl, `/blog/${post.slug}`, DEFAULT_LANGUAGE)
      );
      const newsEl = url.ele("news:news");
      const pubEl = newsEl.ele("news:publication");
      pubEl.ele("news:name", publicationName);
      pubEl.ele("news:language", publicationLang);
      newsEl.ele("news:publication_date", pubDate);
      newsEl.ele("news:title", post.title || post.slug);
    });
  } catch (error) {
    console.error("Error generating news sitemap entries:", error);
  }

  return root.end({ pretty: true });
};

module.exports = {
  generateSitemap,
  generateSitemapIndex,
  generateImageSitemap,
  generateNewsSitemap,
};
