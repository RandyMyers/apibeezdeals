/**
 * Gate store publish/update when isPublished is true.
 */

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function activeFaqs(doc) {
  const faqs = doc.faqs || [];
  return faqs.filter((f) => f.isActive !== false && f.question && f.answer);
}

function assertStorePublishReady(doc) {
  const errors = [];
  const title = doc.metaTitle || doc.seoH1 || doc.name;
  const description = doc.metaDescription || stripHtml(doc.seoIntro || doc.description);

  if (!String(title || "").trim()) errors.push("SEO title or H1");
  if (!String(description || "").trim() || description.length < 40) {
    errors.push("meta description or SEO intro (40+ characters)");
  }
  if (!String(doc.logoAlt || "").trim()) errors.push("logo alt text");
  if (activeFaqs(doc).length < 3) errors.push("at least 3 active FAQs");

  if (errors.length) {
    const err = new Error(`Store cannot be published until you add: ${errors.join(", ")}`);
    err.status = 400;
    err.code = "STORE_PUBLISH_VALIDATION";
    throw err;
  }
}

module.exports = { assertStorePublishReady, activeFaqs };
