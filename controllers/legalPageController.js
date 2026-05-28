const LegalPage = require("../models/LegalPage");
const asyncHandler = require("../utils/asyncHandler");

function resolveLocalized(page, lang) {
  const map = page.languageTranslations instanceof Map
    ? page.languageTranslations
    : new Map(Object.entries(page.languageTranslations || {}));

  const normalized = String(lang || "").trim();
  const base = normalized.split("-")[0];
  const block =
    map.get(normalized) ||
    map.get(base) ||
    null;

  const faqs = Array.isArray(block?.faqs) && block.faqs.length
    ? block.faqs
    : page.faqs || [];

  return {
    slug: page.slug,
    title: block?.title || page.title || "",
    subtitle: block?.subtitle || page.subtitle || "",
    bodyHtml: block?.bodyHtml || page.bodyHtml || "",
    faqs: faqs
      .filter((f) => f && f.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((f) => ({
        question: f.question || "",
        answer: f.answer || "",
      })),
    updatedAt: block?.updatedAt || page.updatedAt || page.createdAt,
  };
}

exports.getBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").toLowerCase().trim();
  if (!["terms", "privacy", "faq"].includes(slug)) {
    const err = new Error("Page not found");
    err.status = 404;
    throw err;
  }

  const page = await LegalPage.findOne({ slug, isPublished: true }).lean();
  if (!page) {
    const err = new Error("Page not found");
    err.status = 404;
    throw err;
  }

  const lang = req.query.lang;
  res.json({ page: resolveLocalized(page, lang) });
});
