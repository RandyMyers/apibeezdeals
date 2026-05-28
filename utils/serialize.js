/** Map DB documents to shapes expected by the CouponDealz CRA client (mock parity). */

const { formatBlogDate } = require("./blogHelpers");
const { i18nToPlain, seoToClient } = require("./blogPayload");
const { storeSeoToClient, storeI18nToPlain } = require("./storePayload");
const { couponI18nToPlain } = require("./couponPayload");

function serializeCategory(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const faqs = (o.faqs || [])
    .filter((f) => f.isActive !== false && f.question && f.answer)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((f) => ({
      question: f.question,
      answer: f.answer,
      order: f.order,
      isActive: f.isActive !== false,
    }));
  return {
    slug: o.slug,
    name: o.name,
    description: o.description,
    image: o.image,
    couponCount: o.couponCount,
    parentSlug: o.parentSlug || undefined,
    seoIntro: o.seoIntro || "",
    metaTitle: o.metaTitle || "",
    metaDescription: o.metaDescription || "",
    faqs,
  };
}

function serializeStore(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const countries = Array.isArray(o.countries)
    ? [...new Set(o.countries.map((c) => String(c).trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))]
    : [];
  return {
    id: o.publicId,
    name: o.name,
    slug: o.slug,
    logo: o.logo,
    couponCount: o.couponCount,
    bestDiscount: o.bestDiscount,
    category: o.category,
    categorySlug: o.categorySlug,
    categoryId: o.categoryId ? String(o.categoryId) : undefined,
    websiteUrl: o.websiteUrl || "",
    linkRelType: o.linkRelType || "noreferrer",
    countries,
    description: o.description || "",
    logoAlt: o.logoAlt || "",
    faqs: o.faqs || [],
    seo: storeSeoToClient(o),
    contentUpdatedAt: o.contentUpdatedAt || undefined,
    lastVerifiedAt: o.lastVerifiedAt || undefined,
    languageTranslations: storeI18nToPlain(o),
  };
}

function serializeCoupon(doc, extra = {}) {
  const o = doc.toObject ? doc.toObject() : doc;
  const countries = Array.isArray(o.countries)
    ? [...new Set(o.countries.map((c) => String(c).trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))]
    : [];
  const out = {
    id: o.publicId,
    storeId: o.storePublicId,
    storeSlug: o.storeSlug,
    storeName: o.storeName,
    storeLogo: o.storeLogo,
    title: o.title,
    description: o.description,
    discountValue: o.discountValue,
    discountType: o.discountType,
    code: o.code || undefined,
    type: o.type,
    verified: o.verified,
    exclusive: o.exclusive,
    expiresAt: o.expiresAt || undefined,
    usedCount: o.usedCount,
    successRate: o.successRate,
    postedBy: o.postedBy,
    postedAt: o.postedAt,
    views: o.views,
    upvotes: o.upvotes,
    downvotes: o.downvotes ?? 0,
    comments: o.comments,
    details: o.details,
    productImage: o.productImage || undefined,
    originalPrice: o.originalPrice || undefined,
    salePrice: o.salePrice || undefined,
    freeShipping: o.freeShipping,
    features: o.features || [],
    categorySlug: o.categorySlug,
    countries,
    updatedAt: o.updatedAt,
    seo: seoToClient(o),
    languageTranslations: couponI18nToPlain(o),
  };
  if (!out.code) delete out.code;
  if (extra.isLiked !== undefined) out.isLiked = Boolean(extra.isLiked);
  if (extra.myVote !== undefined) out.myVote = extra.myVote;
  return out;
}

const {
  getPermissionsForUser,
  ROLE_LABELS,
  isStaff,
} = require("../constants/adminPermissions");

function serializeUser(user) {
  if (!user) return null;
  const o = user.toObject ? user.toObject() : user;
  const role = o.role || "user";
  return {
    id: o.publicId,
    email: o.email,
    name: o.name,
    role,
    roleLabel: ROLE_LABELS[role] || role,
    permissions: getPermissionsForUser(o),
    isStaff: isStaff(o),
    isActive: o.isActive !== false,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function serializeComment(doc, author) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o.publicId,
    couponPublicId: o.couponPublicId,
    userId: author?.publicId || String(o.userId),
    userName: author?.name || "User",
    body: o.body,
    createdAt: o.createdAt,
    editedAt: o.editedAt || undefined,
    isDeleted: o.isDeleted,
  };
}

function serializeBlogPost(doc, { includeUnpublished = false, admin = false } = {}) {
  const o = doc.toObject ? doc.toObject() : doc;
  const publishedAt = o.publishedAt || o.createdAt;
  const out = {
    slug: o.slug,
    title: o.title,
    excerpt: o.excerpt || "",
    content: o.content || "",
    featuredImage: o.featuredImage || "",
    image: o.featuredImage || "",
    readMins: o.readMins || 5,
    authorName: o.authorName || "CouponDealz",
    date: formatBlogDate(publishedAt),
    publishedAt: publishedAt || undefined,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
  if (includeUnpublished) {
    out.isPublished = o.isPublished !== false;
  }
  if (admin) {
    out.seo = seoToClient(o);
    out.i18n = i18nToPlain(o);
    out.metaTitle = o.metaTitle || "";
    out.metaDescription = o.metaDescription || "";
    out.keywords = (o.keywords || []).join(", ");
    out.focusKeyword = o.focusKeyword || "";
    out.canonicalUrl = o.canonicalUrl || "";
    out.ogImage = o.ogImage || "";
    out.robots = o.robots || "index,follow";
    out.sitemapInclude = o.sitemapInclude !== false;
    out.sitemapPriority = o.sitemapPriority ?? 0.6;
    out.sitemapChangefreq = o.sitemapChangefreq || "weekly";
  }
  return out;
}

function serializeSaving(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o.publicId,
    couponPublicId: o.couponPublicId || undefined,
    amount: o.amount,
    currency: o.currency,
    label: o.label || undefined,
    note: o.note || undefined,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

module.exports = {
  serializeCategory,
  serializeStore,
  serializeCoupon,
  serializeUser,
  serializeComment,
  serializeSaving,
  serializeBlogPost,
};
