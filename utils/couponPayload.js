const { pickSeoFromBody } = require("./blogPayload");
const { CONTENT_LOCALE_CODES } = require("./contentLocales");

function parseFeatures(val) {
  if (Array.isArray(val)) {
    return val.map((f) => String(f).trim()).filter(Boolean).slice(0, 32);
  }
  if (typeof val === "string") {
    return val
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 32);
  }
  return undefined;
}

function pickCouponLocaleBlock(raw) {
  if (!raw || typeof raw !== "object") return null;
  const block = {};
  if (raw.title !== undefined) block.title = String(raw.title).trim();
  if (raw.description !== undefined) block.description = String(raw.description);
  if (raw.details !== undefined) block.details = String(raw.details);
  if (raw.expiresAt !== undefined) block.expiresAt = String(raw.expiresAt).trim().slice(0, 80);
  if (raw.discountValue !== undefined) {
    block.discountValue = String(raw.discountValue).trim().slice(0, 80);
  }
  if (raw.originalPrice !== undefined) {
    block.originalPrice = String(raw.originalPrice).trim().slice(0, 40);
  }
  if (raw.salePrice !== undefined) block.salePrice = String(raw.salePrice).trim().slice(0, 40);
  if (raw.features !== undefined) {
    const features = parseFeatures(raw.features);
    if (features) block.features = features;
  } else if (raw.featuresText !== undefined) {
    const features = parseFeatures(raw.featuresText);
    if (features) block.features = features;
  }
  Object.assign(block, pickSeoFromBody(raw));
  const seo = raw.seo;
  if (seo && typeof seo === "object") {
    Object.assign(block, pickSeoFromBody({ seo }));
  }
  return Object.keys(block).length ? block : null;
}

function pickCouponI18nFromBody(body) {
  const raw = body.languageTranslations || body.i18n;
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const loc of CONTENT_LOCALE_CODES) {
    const block = pickCouponLocaleBlock(raw[loc]);
    if (block) out[loc] = block;
  }
  return Object.keys(out).length ? out : null;
}

function couponI18nToPlain(doc) {
  if (!doc?.languageTranslations) return {};
  const out = {};
  const entries =
    doc.languageTranslations instanceof Map
      ? doc.languageTranslations.entries()
      : Object.entries(doc.languageTranslations);
  for (const [loc, block] of entries) {
    if (!block) continue;
    out[loc] = {
      title: block.title || "",
      description: block.description || "",
      details: block.details || "",
      features: block.features || [],
      featuresText: (block.features || []).join("\n"),
      expiresAt: block.expiresAt || "",
      discountValue: block.discountValue || "",
      originalPrice: block.originalPrice || "",
      salePrice: block.salePrice || "",
      metaTitle: block.metaTitle || "",
      metaDescription: block.metaDescription || "",
      keywords: block.keywords || [],
      focusKeyword: block.focusKeyword || "",
      canonicalUrl: block.canonicalUrl || "",
      ogImage: block.ogImage || "",
      robots: block.robots || "",
      seo: {
        title: block.metaTitle || "",
        description: block.metaDescription || "",
        keywords: (block.keywords || []).join(", "),
        focusKeyword: block.focusKeyword || "",
        canonicalUrl: block.canonicalUrl || "",
        ogImage: block.ogImage || "",
        robots: block.robots || "index,follow",
      },
    };
  }
  return out;
}

module.exports = {
  pickCouponLocaleBlock,
  pickCouponI18nFromBody,
  couponI18nToPlain,
};
