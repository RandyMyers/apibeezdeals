const BLOG_LOCALES = ["ga", "de", "es", "it", "no", "fi", "da", "sv", "fr", "pt", "nl"];

function parseKeywords(val) {
  if (Array.isArray(val)) {
    return val.map((k) => String(k).trim()).filter(Boolean).slice(0, 32);
  }
  if (typeof val === "string") {
    return val
      .split(/[,;]+/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 32);
  }
  return [];
}

function pickSeoFromBody(body) {
  const out = {};
  if (body.metaTitle !== undefined) out.metaTitle = String(body.metaTitle).trim().slice(0, 70);
  if (body.metaDescription !== undefined) {
    out.metaDescription = String(body.metaDescription).trim().slice(0, 160);
  }
  if (body.keywords !== undefined) out.keywords = parseKeywords(body.keywords);
  if (body.focusKeyword !== undefined) out.focusKeyword = String(body.focusKeyword).trim().slice(0, 80);
  if (body.canonicalUrl !== undefined) out.canonicalUrl = String(body.canonicalUrl).trim().slice(0, 2048);
  if (body.ogImage !== undefined) out.ogImage = String(body.ogImage).trim().slice(0, 2048);
  if (body.robots !== undefined) out.robots = String(body.robots).trim().slice(0, 64);
  if (body.sitemapInclude !== undefined) out.sitemapInclude = Boolean(body.sitemapInclude);
  if (body.sitemapPriority !== undefined) {
    const p = Number(body.sitemapPriority);
    if (Number.isFinite(p)) out.sitemapPriority = Math.min(1, Math.max(0, p));
  }
  if (body.sitemapChangefreq !== undefined) {
    out.sitemapChangefreq = String(body.sitemapChangefreq).trim();
  }
  const seo = body.seo;
  if (seo && typeof seo === "object") {
    if (seo.title !== undefined) out.metaTitle = String(seo.title).trim().slice(0, 70);
    if (seo.description !== undefined) {
      out.metaDescription = String(seo.description).trim().slice(0, 160);
    }
    if (seo.keywords !== undefined) out.keywords = parseKeywords(seo.keywords);
    if (seo.focusKeyword !== undefined) out.focusKeyword = String(seo.focusKeyword).trim().slice(0, 80);
    if (seo.canonicalUrl !== undefined) out.canonicalUrl = String(seo.canonicalUrl).trim().slice(0, 2048);
    if (seo.ogImage !== undefined) out.ogImage = String(seo.ogImage).trim().slice(0, 2048);
    if (seo.robots !== undefined) out.robots = String(seo.robots).trim().slice(0, 64);
    const sm = seo.sitemap;
    if (sm && typeof sm === "object") {
      if (sm.include !== undefined) out.sitemapInclude = Boolean(sm.include);
      if (sm.priority !== undefined) {
        const p = Number(sm.priority);
        if (Number.isFinite(p)) out.sitemapPriority = Math.min(1, Math.max(0, p));
      }
      if (sm.changefreq !== undefined) out.sitemapChangefreq = String(sm.changefreq).trim();
    }
  }
  return out;
}

function pickLocaleBlock(raw) {
  if (!raw || typeof raw !== "object") return null;
  const block = {};
  if (raw.title !== undefined) block.title = String(raw.title).trim();
  if (raw.excerpt !== undefined) block.excerpt = String(raw.excerpt);
  if (raw.content !== undefined) block.content = String(raw.content);
  if (raw.slug !== undefined) block.slug = String(raw.slug).trim().toLowerCase();
  if (raw.metaTitle !== undefined) block.metaTitle = String(raw.metaTitle).trim().slice(0, 70);
  if (raw.metaDescription !== undefined) {
    block.metaDescription = String(raw.metaDescription).trim().slice(0, 160);
  }
  if (raw.keywords !== undefined) block.keywords = parseKeywords(raw.keywords);
  if (raw.focusKeyword !== undefined) block.focusKeyword = String(raw.focusKeyword).trim().slice(0, 80);
  const seo = raw.seo;
  if (seo && typeof seo === "object") {
    if (seo.title !== undefined) block.metaTitle = String(seo.title).trim().slice(0, 70);
    if (seo.description !== undefined) {
      block.metaDescription = String(seo.description).trim().slice(0, 160);
    }
    if (seo.keywords !== undefined) block.keywords = parseKeywords(seo.keywords);
    if (seo.focusKeyword !== undefined) block.focusKeyword = String(seo.focusKeyword).trim().slice(0, 80);
  }
  return Object.keys(block).length ? block : null;
}

function pickI18nFromBody(body) {
  const raw = body.i18n;
  if (!raw || typeof raw !== "object") return null;
  const map = new Map();
  for (const loc of BLOG_LOCALES) {
    const block = pickLocaleBlock(raw[loc]);
    if (block) map.set(loc, block);
  }
  return map.size ? map : null;
}

function i18nToPlain(doc) {
  if (!doc?.i18n) return {};
  const out = {};
  const entries = doc.i18n instanceof Map ? doc.i18n.entries() : Object.entries(doc.i18n);
  for (const [loc, block] of entries) {
    if (!block) continue;
    out[loc] = {
      title: block.title || "",
      excerpt: block.excerpt || "",
      content: block.content || "",
      slug: block.slug || "",
      metaTitle: block.metaTitle || "",
      metaDescription: block.metaDescription || "",
      keywords: block.keywords || [],
      focusKeyword: block.focusKeyword || "",
    };
  }
  return out;
}

function seoToClient(doc) {
  return {
    title: doc.metaTitle || "",
    description: doc.metaDescription || "",
    keywords: (doc.keywords || []).join(", "),
    focusKeyword: doc.focusKeyword || "",
    canonicalUrl: doc.canonicalUrl || "",
    ogImage: doc.ogImage || "",
    robots: doc.robots || "index,follow",
    sitemap: {
      include: doc.sitemapInclude !== false,
      priority: doc.sitemapPriority ?? 0.6,
      changefreq: doc.sitemapChangefreq || "weekly",
    },
  };
}

module.exports = {
  BLOG_LOCALES,
  parseKeywords,
  pickSeoFromBody,
  pickI18nFromBody,
  i18nToPlain,
  seoToClient,
};
