const { pickSeoFromBody, seoToClient } = require("./blogPayload");
const { CONTENT_LOCALE_CODES } = require("./contentLocales");

function pickFaqs(raw) {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((f, i) => ({
      question: String(f.question || "").trim(),
      answer: String(f.answer || "").trim(),
      group: ["faq", "paa", "troubleshooting"].includes(f.group) ? f.group : "faq",
      order: Number.isFinite(Number(f.order)) ? Number(f.order) : i,
      isActive: f.isActive !== false,
    }))
    .filter((f) => f.question && f.answer)
    .slice(0, 64);
}

function pickStoreLocaleBlock(raw) {
  if (!raw || typeof raw !== "object") return null;
  const block = {};
  if (raw.name !== undefined) block.name = String(raw.name).trim().slice(0, 120);
  if (raw.description !== undefined) block.description = String(raw.description);
  if (raw.logoAlt !== undefined) block.logoAlt = String(raw.logoAlt).trim().slice(0, 200);
  if (raw.seoH1 !== undefined) block.seoH1 = String(raw.seoH1).trim().slice(0, 120);
  if (raw.seoIntro !== undefined) block.seoIntro = String(raw.seoIntro).trim().slice(0, 4000);
  Object.assign(block, pickSeoFromBody(raw));
  const seoNested = raw.seo;
  if (seoNested && typeof seoNested === "object") {
    Object.assign(block, pickSeoFromBody({ seo: seoNested }));
    if (seoNested.h1 !== undefined) block.seoH1 = String(seoNested.h1).trim().slice(0, 120);
    if (seoNested.intro !== undefined) block.seoIntro = String(seoNested.intro).trim().slice(0, 4000);
  }
  if (raw.faqs !== undefined) {
    const faqs = pickFaqs(raw.faqs);
    if (faqs) block.faqs = faqs;
  }
  return Object.keys(block).length ? block : null;
}

function pickStoreI18nFromBody(body) {
  const raw = body.languageTranslations || body.i18n;
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const loc of CONTENT_LOCALE_CODES) {
    const block = pickStoreLocaleBlock(raw[loc]);
    if (block) out[loc] = block;
  }
  return Object.keys(out).length ? out : null;
}

function storeSeoToClient(doc) {
  return {
    ...seoToClient(doc),
    h1: doc.seoH1 || "",
    intro: doc.seoIntro || "",
    primaryKeyword: doc.seoPrimaryKeyword || "",
  };
}

function localeSeoToClient(block) {
  return {
    ...seoToClient(block),
    h1: block.seoH1 || "",
    intro: block.seoIntro || "",
  };
}

function storeI18nToPlain(doc) {
  if (!doc?.languageTranslations) return {};
  const out = {};
  const entries =
    doc.languageTranslations instanceof Map
      ? doc.languageTranslations.entries()
      : Object.entries(doc.languageTranslations);
  for (const [loc, block] of entries) {
    if (!block) continue;
    out[loc] = {
      name: block.name || "",
      description: block.description || "",
      logoAlt: block.logoAlt || "",
      seoH1: block.seoH1 || "",
      seoIntro: block.seoIntro || "",
      metaTitle: block.metaTitle || "",
      metaDescription: block.metaDescription || "",
      keywords: block.keywords || [],
      focusKeyword: block.focusKeyword || "",
      faqs: block.faqs || [],
      seo: localeSeoToClient(block),
    };
  }
  return out;
}

function pickStoreContentFromBody(body) {
  const out = {};
  if (body.description !== undefined) out.description = String(body.description);
  if (body.logoAlt !== undefined) out.logoAlt = String(body.logoAlt).trim().slice(0, 200);
  if (body.seoH1 !== undefined) out.seoH1 = String(body.seoH1).trim().slice(0, 120);
  if (body.seoIntro !== undefined) out.seoIntro = String(body.seoIntro).trim().slice(0, 4000);
  if (body.seoPrimaryKeyword !== undefined) {
    out.seoPrimaryKeyword = String(body.seoPrimaryKeyword).trim().slice(0, 80);
  }
  Object.assign(out, pickSeoFromBody(body || {}));
  const seo = body.seo;
  if (seo && typeof seo === "object") {
    Object.assign(out, pickSeoFromBody({ seo }));
    if (seo.h1 !== undefined) out.seoH1 = String(seo.h1).trim().slice(0, 120);
    if (seo.intro !== undefined) out.seoIntro = String(seo.intro).trim().slice(0, 4000);
    if (seo.primaryKeyword !== undefined) {
      out.seoPrimaryKeyword = String(seo.primaryKeyword).trim().slice(0, 80);
    }
  }
  if (body.faqs !== undefined) {
    const faqs = pickFaqs(body.faqs);
    if (faqs) out.faqs = faqs;
  }
  if (body.contentUpdatedAt) {
    out.contentUpdatedAt = new Date(body.contentUpdatedAt);
  } else if (body.description !== undefined || body.faqs !== undefined) {
    out.contentUpdatedAt = new Date();
  }
  if (body.lastVerifiedAt) {
    out.lastVerifiedAt = new Date(body.lastVerifiedAt);
  }
  const i18n = pickStoreI18nFromBody(body);
  if (i18n) out.languageTranslations = i18n;
  return out;
}

module.exports = {
  pickFaqs,
  pickStoreContentFromBody,
  pickStoreI18nFromBody,
  storeSeoToClient,
  storeI18nToPlain,
};
