function pickFaqs(raw) {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((f, i) => ({
      question: String(f.question || "").trim(),
      answer: String(f.answer || "").trim(),
      order: Number.isFinite(Number(f.order)) ? Number(f.order) : i + 1,
      isActive: f.isActive !== false,
    }))
    .filter((f) => f.question && f.answer)
    .slice(0, 32);
}

function pickCategoryPayload(body) {
  const out = {};
  const fields = [
    "slug",
    "name",
    "description",
    "image",
    "couponCount",
    "parentSlug",
    "isActive",
    "seoIntro",
    "metaTitle",
    "metaDescription",
  ];
  fields.forEach((k) => {
    if (body[k] !== undefined) out[k] = body[k];
  });
  if (out.slug) out.slug = String(out.slug).toLowerCase().trim();
  if (out.parentSlug === "") out.parentSlug = null;
  if (body.faqs !== undefined) {
    const faqs = pickFaqs(body.faqs);
    if (faqs) out.faqs = faqs;
  }
  return out;
}

module.exports = { pickCategoryPayload, pickFaqs };
