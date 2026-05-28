const User = require("../models/User");
const Store = require("../models/Store");
const Category = require("../models/Category");
const Coupon = require("../models/Coupon");
const CouponComment = require("../models/CouponComment");
const CouponVote = require("../models/CouponVote");
const CouponLike = require("../models/CouponLike");
const CouponView = require("../models/CouponView");
const ActivityLog = require("../models/ActivityLog");
const Visitor = require("../models/Visitor");
const CouponSubmission = require("../models/CouponSubmission");
const Affiliate = require("../models/Affiliate");
const ContactMessage = require("../models/ContactMessage");
const BlogPost = require("../models/BlogPost");
const LegalPage = require("../models/LegalPage");
const UserSaving = require("../models/UserSaving");
const asyncHandler = require("../utils/asyncHandler");
const {
  serializeUser,
  serializeCategory,
  serializeStore,
  serializeCoupon,
  serializeComment,
  serializeBlogPost,
} = require("../utils/serialize");
const { createPublicId } = require("../utils/publicId");
const { hashPassword } = require("../utils/password");
const {
  STAFF_ROLES,
  ASSIGNABLE_STAFF_ROLES,
} = require("../constants/adminPermissions");

function normalizeFaqArray(rawFaqs) {
  if (!Array.isArray(rawFaqs)) return [];
  return rawFaqs
    .map((item, idx) => ({
      question: String(item?.question || "").trim(),
      answer: String(item?.answer || "").trim(),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : idx + 1,
      isActive: item?.isActive !== false,
    }))
    .filter((f) => f.question && f.answer)
    .sort((a, b) => a.order - b.order);
}

function legalLocaleMapToPlain(mapLike) {
  const map = mapLike instanceof Map
    ? mapLike
    : new Map(Object.entries(mapLike || {}));
  const out = {};
  for (const [locale, row] of map.entries()) {
    out[locale] = {
      title: row?.title || "",
      subtitle: row?.subtitle || "",
      bodyHtml: row?.bodyHtml || "",
      faqs: normalizeFaqArray(row?.faqs || []),
      updatedAt: row?.updatedAt || undefined,
    };
  }
  return out;
}

async function createCouponFromSubmissionRow(row) {
  if (row.createdCouponPublicId) return row.createdCouponPublicId;
  const store = await Store.findOne({ publicId: row.storePublicId }).lean();
  if (!store) {
    const err = new Error("Store not found for submission");
    err.status = 400;
    throw err;
  }
  const publicId = createPublicId("c");
  const exists = await Coupon.findOne({ publicId });
  if (exists) {
    const err = new Error("Could not allocate coupon id");
    err.status = 500;
    throw err;
  }
  await Coupon.create({
    publicId,
    storePublicId: store.publicId,
    storeSlug: store.slug,
    storeName: store.name,
    storeLogo: store.logo || "",
    title: row.title,
    description: row.description || "",
    code: row.code || "",
    type: ["code", "deal", "sale"].includes(row.type) ? row.type : "code",
    discountValue: row.discountValue || "",
    discountType: "percentage",
    categorySlug: store.categorySlug || "",
    isPublished: true,
    views: 0,
    upvotes: 0,
    downvotes: 0,
    comments: 0,
    countries: [],
  });
  return publicId;
}

exports.stats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    users,
    stores,
    categories,
    coupons,
    comments,
    votes,
    likes,
    views24h,
    submissionsPending,
    activities24h,
    pageViews24h,
    visitorsTotal,
    visitors24h,
  ] = await Promise.all([
    User.countDocuments({}),
    Store.countDocuments({ isPublished: true }),
    Category.countDocuments({}),
    Coupon.countDocuments({ isPublished: true }),
    CouponComment.countDocuments({ isDeleted: false }),
    CouponVote.countDocuments({}),
    CouponLike.countDocuments({}),
    CouponView.countDocuments({ createdAt: { $gte: since } }),
    CouponSubmission.countDocuments({ status: "pending" }),
    ActivityLog.countDocuments({ createdAt: { $gte: since } }),
    ActivityLog.countDocuments({ createdAt: { $gte: since } }),
    Visitor.countDocuments({}),
    Visitor.countDocuments({ lastSeenAt: { $gte: since } }),
  ]);
  res.json({
    counts: {
      users,
      stores,
      categories,
      coupons,
      comments,
      votes,
      likes,
      views24h,
      submissionsPending,
      activities24h,
      pageViews24h,
      visitorsTotal,
      visitors24h,
    },
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const role = req.query.role ? String(req.query.role) : null;
  const staffOnly = req.query.staffOnly === "1" || req.query.staffOnly === "true";
  const q = {};
  if (role) q.role = role;
  else if (staffOnly) q.role = { $in: STAFF_ROLES };
  const users = await User.find(q)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-passwordHash")
    .lean();
  res.json({ users: users.map(serializeUser) });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password || !name) {
    const err = new Error("email, password, and name are required");
    err.status = 400;
    throw err;
  }
  if (String(password).length < 8) {
    const err = new Error("password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  const nextRole = role || "blog_editor";
  if (!ASSIGNABLE_STAFF_ROLES.includes(nextRole)) {
    const err = new Error(
      `role must be one of: ${ASSIGNABLE_STAFF_ROLES.join(", ")}`
    );
    err.status = 400;
    throw err;
  }
  const normalized = String(email).toLowerCase().trim();
  const exists = await User.findOne({ email: normalized });
  if (exists) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const row = await User.create({
    publicId: createPublicId("u"),
    email: normalized,
    passwordHash: await hashPassword(String(password)),
    name: String(name).trim(),
    role: nextRole,
    isActive: true,
    permissions: [],
  });
  res.status(201).json({ user: serializeUser(row.toObject()) });
});

exports.patchUser = asyncHandler(async (req, res) => {
  const row = await User.findOne({ publicId: req.params.publicId });
  if (!row) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const { role, name, email, password, isActive } = req.body || {};

  if (name !== undefined) row.name = String(name).trim();
  if (email !== undefined) {
    const normalized = String(email).toLowerCase().trim();
    if (!normalized) {
      const err = new Error("email cannot be empty");
      err.status = 400;
      throw err;
    }
    const dup = await User.findOne({ email: normalized, publicId: { $ne: row.publicId } });
    if (dup) {
      const err = new Error("Email already in use");
      err.status = 409;
      throw err;
    }
    row.email = normalized;
  }
  if (password !== undefined && String(password).length > 0) {
    if (String(password).length < 8) {
      const err = new Error("password must be at least 8 characters");
      err.status = 400;
      throw err;
    }
    row.passwordHash = await hashPassword(String(password));
  }
  if (isActive !== undefined) row.isActive = isActive !== false;

  if (role !== undefined) {
    if (!ASSIGNABLE_STAFF_ROLES.includes(role) && role !== "user") {
      const err = new Error(
        `role must be one of: user, ${ASSIGNABLE_STAFF_ROLES.join(", ")}`
      );
      err.status = 400;
      throw err;
    }
    if (req.user.publicId === row.publicId && row.role === "admin" && role !== "admin") {
      const err = new Error("You cannot remove your own administrator role");
      err.status = 400;
      throw err;
    }
    if (row.role === "admin" && role !== "admin") {
      const admins = await User.countDocuments({ role: "admin", isActive: { $ne: false } });
      if (admins <= 1) {
        const err = new Error("Cannot demote the last active administrator");
        err.status = 400;
        throw err;
      }
    }
    row.role = role;
    row.permissions = [];
  }

  if (req.user.publicId === row.publicId && row.isActive === false) {
    const err = new Error("You cannot deactivate your own account");
    err.status = 400;
    throw err;
  }

  await row.save();
  res.json({ user: serializeUser(row.toObject()) });
});

exports.listActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const skip = Math.min(Number(req.query.skip) || 0, 10000);
  const [rows, total] = await Promise.all([
    ActivityLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments({}),
  ]);
  res.json({
    activities: rows.map((o) => ({
      id: o.publicId,
      path: o.path,
      title: o.title || undefined,
      referrer: o.referrer || undefined,
      country: o.country || undefined,
      userPublicId: o.userPublicId || undefined,
      anonKey: o.anonKey ? "[set]" : undefined,
      affiliateCode: o.affiliateCode || undefined,
      createdAt: o.createdAt,
    })),
    total,
    skip,
    limit,
  });
});

exports.listSubmissions = asyncHandler(async (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const q = {};
  if (status && ["pending", "reviewing", "approved", "rejected"].includes(status)) {
    q.status = status;
  }
  const rows = await CouponSubmission.find(q).sort({ createdAt: -1 }).limit(200).lean();
  res.json({
    submissions: rows.map((o) => ({
      id: o.publicId,
      userPublicId: o.userPublicId,
      storePublicId: o.storePublicId,
      title: o.title,
      description: o.description,
      code: o.code || undefined,
      discountValue: o.discountValue || undefined,
      type: o.type,
      status: o.status,
      adminNote: o.adminNote || undefined,
      couponId: o.createdCouponPublicId || undefined,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    })),
  });
});

exports.patchSubmission = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body || {};
  if (!["pending", "reviewing", "approved", "rejected"].includes(status)) {
    const err = new Error("status must be pending|reviewing|approved|rejected");
    err.status = 400;
    throw err;
  }
  const row = await CouponSubmission.findOne({ publicId: req.params.publicId });
  if (!row) {
    const err = new Error("Submission not found");
    err.status = 404;
    throw err;
  }
  row.status = status;
  if (adminNote != null) row.adminNote = String(adminNote).slice(0, 2000);
  if (status === "approved" && !row.createdCouponPublicId) {
    const couponId = await createCouponFromSubmissionRow(row);
    row.createdCouponPublicId = couponId;
  }
  await row.save();
  res.json({
    submission: {
      id: row.publicId,
      userPublicId: row.userPublicId,
      storePublicId: row.storePublicId,
      title: row.title,
      status: row.status,
      adminNote: row.adminNote || undefined,
      couponId: row.createdCouponPublicId || undefined,
      updatedAt: row.updatedAt,
    },
  });
});

exports.listAffiliates = asyncHandler(async (req, res) => {
  const rows = await Affiliate.find({}).sort({ createdAt: -1 }).limit(200).lean();
  res.json({
    affiliates: rows.map((o) => ({
      id: o.publicId,
      name: o.name,
      trackingCode: o.trackingCode,
      contactEmail: o.contactEmail || undefined,
      commissionPercent: o.commissionPercent,
      isActive: o.isActive,
      createdAt: o.createdAt,
    })),
  });
});

exports.createAffiliate = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) {
    const err = new Error("name is required");
    err.status = 400;
    throw err;
  }
  let trackingCode = String(req.body?.trackingCode || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 64);
  if (!trackingCode) {
    trackingCode = createPublicId("aff").replace(/_/g, "").slice(0, 32);
  }
  const taken = await Affiliate.findOne({ trackingCode }).lean();
  if (taken) {
    const err = new Error("trackingCode already in use");
    err.status = 409;
    throw err;
  }
  const row = await Affiliate.create({
    publicId: createPublicId("af"),
    name,
    trackingCode,
    contactEmail: req.body?.contactEmail
      ? String(req.body.contactEmail).toLowerCase().trim().slice(0, 320)
      : "",
    notes: req.body?.notes != null ? String(req.body.notes).slice(0, 4000) : "",
    commissionPercent: Math.min(
      100,
      Math.max(0, Number(req.body?.commissionPercent) || 0)
    ),
    isActive: req.body?.isActive !== false,
  });
  res.status(201).json({
    affiliate: {
      id: row.publicId,
      name: row.name,
      trackingCode: row.trackingCode,
      contactEmail: row.contactEmail || undefined,
      commissionPercent: row.commissionPercent,
      isActive: row.isActive,
    },
  });
});

exports.patchAffiliate = asyncHandler(async (req, res) => {
  const row = await Affiliate.findOne({ publicId: req.params.publicId });
  if (!row) {
    const err = new Error("Affiliate not found");
    err.status = 404;
    throw err;
  }
  if (req.body.name != null) {
    row.name = String(req.body.name).trim().slice(0, 200);
    if (!row.name) {
      const err = new Error("name cannot be empty");
      err.status = 400;
      throw err;
    }
  }
  if (req.body.contactEmail != null) {
    row.contactEmail = String(req.body.contactEmail).toLowerCase().trim().slice(0, 320);
  }
  if (req.body.notes != null) {
    row.notes = String(req.body.notes).slice(0, 4000);
  }
  if (req.body.commissionPercent != null) {
    row.commissionPercent = Math.min(
      100,
      Math.max(0, Number(req.body.commissionPercent) || 0)
    );
  }
  if (req.body.isActive != null) {
    row.isActive = Boolean(req.body.isActive);
  }
  await row.save();
  res.json({
    affiliate: {
      id: row.publicId,
      name: row.name,
      trackingCode: row.trackingCode,
      contactEmail: row.contactEmail || undefined,
      commissionPercent: row.commissionPercent,
      isActive: row.isActive,
    },
  });
});

exports.deleteAffiliate = asyncHandler(async (req, res) => {
  const r = await Affiliate.findOneAndDelete({ publicId: req.params.publicId });
  if (!r) {
    const err = new Error("Affiliate not found");
    err.status = 404;
    throw err;
  }
  res.status(204).send();
});

exports.listModerationComments = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 300);
  const skip = Math.min(Number(req.query.skip) || 0, 5000);
  const rows = await CouponComment.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const userIds = [...new Set(rows.map((d) => String(d.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  const couponIds = [...new Set(rows.map((r) => r.couponPublicId))];
  const coupons = await Coupon.find({ publicId: { $in: couponIds } })
    .select("publicId title storeName")
    .lean();
  const byC = new Map(coupons.map((c) => [c.publicId, c]));
  res.json({
    comments: rows.map((d) => {
      const c = byC.get(d.couponPublicId) || {};
      return {
        ...serializeComment(d, byId.get(String(d.userId))),
        couponPublicId: d.couponPublicId,
        couponTitle: c.title,
        storeName: c.storeName,
      };
    }),
  });
});

exports.listContactMessages = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 300);
  const rows = await ContactMessage.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({
    messages: rows.map((o) => ({
      id: o.publicId,
      name: o.name,
      email: o.email,
      message: o.message,
      read: o.read,
      createdAt: o.createdAt,
    })),
  });
});

exports.patchContactMessage = asyncHandler(async (req, res) => {
  const row = await ContactMessage.findOne({ publicId: req.params.publicId });
  if (!row) {
    const err = new Error("Message not found");
    err.status = 404;
    throw err;
  }
  if (req.body.read === true || req.body.read === false) {
    row.read = req.body.read;
  } else {
    row.read = true;
  }
  await row.save();
  res.json({
    message: {
      id: row.publicId,
      read: row.read,
    },
  });
});

/** Full category list for admin (includes inactive). */
exports.listCatalogCategories = asyncHandler(async (req, res) => {
  const rows = await Category.find({}).sort({ name: 1 }).lean();
  res.json({
    categories: rows.map((o) => ({
      ...serializeCategory(o),
      isActive: o.isActive !== false,
    })),
  });
});

/** Full blog list for admin (includes drafts). */
exports.listCatalogBlogPosts = asyncHandler(async (req, res) => {
  const rows = await BlogPost.find({})
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();
  res.json({
    posts: rows.map((o) => serializeBlogPost(o, { includeUnpublished: true, admin: true })),
  });
});

exports.listLegalPages = asyncHandler(async (req, res) => {
  const rows = await LegalPage.find({})
    .sort({ slug: 1 })
    .lean();
  res.json({
    pages: rows.map((o) => ({
      slug: o.slug,
      title: o.title || "",
      subtitle: o.subtitle || "",
      bodyHtml: o.bodyHtml || "",
      faqs: normalizeFaqArray(o.faqs || []),
      isPublished: o.isPublished !== false,
      languageTranslations: legalLocaleMapToPlain(o.languageTranslations),
      updatedAt: o.updatedAt,
    })),
  });
});

exports.patchLegalPage = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!["terms", "privacy", "faq"].includes(slug)) {
    const err = new Error("Invalid legal page slug");
    err.status = 400;
    throw err;
  }
  const row = await LegalPage.findOne({ slug });
  if (!row) {
    const err = new Error("Legal page not found");
    err.status = 404;
    throw err;
  }

  if (req.body?.title !== undefined) row.title = String(req.body.title || "").trim();
  if (req.body?.subtitle !== undefined) row.subtitle = String(req.body.subtitle || "").trim();
  if (req.body?.bodyHtml !== undefined) row.bodyHtml = String(req.body.bodyHtml || "");
  if (req.body?.isPublished !== undefined) row.isPublished = req.body.isPublished !== false;
  if (req.body?.faqs !== undefined) row.faqs = normalizeFaqArray(req.body.faqs);

  if (req.body?.languageTranslations && typeof req.body.languageTranslations === "object") {
    const next = new Map(
      row.languageTranslations instanceof Map
        ? row.languageTranslations.entries()
        : Object.entries(row.languageTranslations || {})
    );
    for (const [locale, block] of Object.entries(req.body.languageTranslations)) {
      if (!locale || typeof block !== "object" || !block) continue;
      const prev = next.get(locale) || {};
      next.set(locale, {
        ...prev,
        ...(block.title !== undefined ? { title: String(block.title || "").trim() } : {}),
        ...(block.subtitle !== undefined ? { subtitle: String(block.subtitle || "").trim() } : {}),
        ...(block.bodyHtml !== undefined ? { bodyHtml: String(block.bodyHtml || "") } : {}),
        ...(block.faqs !== undefined ? { faqs: normalizeFaqArray(block.faqs) } : {}),
        updatedAt: new Date(),
      });
    }
    row.languageTranslations = next;
  }

  await row.save();
  res.json({
    page: {
      slug: row.slug,
      title: row.title || "",
      subtitle: row.subtitle || "",
      bodyHtml: row.bodyHtml || "",
      faqs: normalizeFaqArray(row.faqs || []),
      isPublished: row.isPublished !== false,
      languageTranslations: legalLocaleMapToPlain(row.languageTranslations),
      updatedAt: row.updatedAt,
    },
  });
});

/** Full store list for admin (includes unpublished). */
exports.listCatalogStores = asyncHandler(async (req, res) => {
  const rows = await Store.find({}).sort({ name: 1 }).lean();
  res.json({
    stores: rows.map((o) => ({
      ...serializeStore(o),
      isPublished: o.isPublished !== false,
    })),
  });
});

/** Coupon list for admin (includes unpublished). */
exports.listCatalogCoupons = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 300, 500);
  const rows = await Coupon.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({
    coupons: rows.map((o) => ({
      ...serializeCoupon(o),
      isPublished: o.isPublished !== false,
    })),
  });
});

/** Single coupon by public id (any publish state). */
exports.getCatalogCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ publicId: req.params.publicId }).lean();
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  res.json({
    coupon: {
      ...serializeCoupon(coupon),
      isPublished: coupon.isPublished !== false,
    },
  });
});

/** Store detail stats for admin dashboard. */
exports.getStoreStats = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ slug: req.params.slug }).lean();
  if (!store) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }

  const coupons = await Coupon.find({ storeSlug: store.slug }).lean();
  const couponIds = coupons.map((c) => c.publicId);

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalViews,
    views24h,
    views7d,
    totalLikes,
    totalVotes,
    totalComments,
    viewsByDayRaw,
    recentLikesRaw,
    recentSubmissions,
  ] = await Promise.all([
    CouponView.countDocuments({ couponPublicId: { $in: couponIds } }),
    CouponView.countDocuments({ couponPublicId: { $in: couponIds }, createdAt: { $gte: since24h } }),
    CouponView.countDocuments({ couponPublicId: { $in: couponIds }, createdAt: { $gte: since7d } }),
    CouponLike.countDocuments({ couponPublicId: { $in: couponIds } }),
    CouponVote.countDocuments({ couponPublicId: { $in: couponIds } }),
    CouponComment.countDocuments({ couponPublicId: { $in: couponIds }, isDeleted: false }),
    couponIds.length
      ? CouponView.aggregate([
          { $match: { couponPublicId: { $in: couponIds }, createdAt: { $gte: since30d } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
      : Promise.resolve([]),
    CouponLike.find({ couponPublicId: { $in: couponIds } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    CouponSubmission.find({ storePublicId: store.publicId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const likerIds = [...new Set(recentLikesRaw.map((l) => String(l.userId)).filter(Boolean))];
  const likers = await User.find({ _id: { $in: likerIds } })
    .select("publicId name email")
    .lean();
  const likerMap = new Map(likers.map((u) => [String(u._id), u]));

  const topCoupons = [...coupons]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map((c) => ({
      id: c.publicId,
      title: c.title,
      type: c.type,
      views: c.views || 0,
      upvotes: c.upvotes || 0,
      downvotes: c.downvotes || 0,
      isPublished: c.isPublished !== false,
    }));

  res.json({
    store: { ...serializeStore(store), isPublished: store.isPublished !== false },
    stats: {
      totalCoupons: coupons.length,
      publishedCoupons: coupons.filter((c) => c.isPublished !== false).length,
      totalViews,
      views24h,
      views7d,
      totalLikes,
      totalVotes,
      totalComments,
    },
    viewsByDay: viewsByDayRaw.map((d) => ({ date: d._id, count: d.count })),
    topCoupons,
    recentLikedBy: recentLikesRaw.map((l) => {
      const u = likerMap.get(String(l.userId));
      return {
        couponPublicId: l.couponPublicId,
        userName: u ? u.name : "Anonymous",
        userEmail: u ? u.email : undefined,
        userPublicId: u ? u.publicId : undefined,
        likedAt: l.createdAt,
      };
    }),
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.publicId,
      title: s.title,
      status: s.status,
      createdAt: s.createdAt,
    })),
  });
});

/** Coupon detail stats for admin dashboard. */
exports.getCouponStats = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ publicId: req.params.publicId }).lean();
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalViews,
    views24h,
    views7d,
    totalLikes,
    upvoteCount,
    downvoteCount,
    viewsByDayRaw,
    likesRaw,
    recentCommentsRaw,
    savingsCount,
  ] = await Promise.all([
    CouponView.countDocuments({ couponPublicId: coupon.publicId }),
    CouponView.countDocuments({ couponPublicId: coupon.publicId, createdAt: { $gte: since24h } }),
    CouponView.countDocuments({ couponPublicId: coupon.publicId, createdAt: { $gte: since7d } }),
    CouponLike.countDocuments({ couponPublicId: coupon.publicId }),
    CouponVote.countDocuments({ couponPublicId: coupon.publicId, value: 1 }),
    CouponVote.countDocuments({ couponPublicId: coupon.publicId, value: -1 }),
    CouponView.aggregate([
      { $match: { couponPublicId: coupon.publicId, createdAt: { $gte: since30d } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CouponLike.find({ couponPublicId: coupon.publicId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    CouponComment.find({ couponPublicId: coupon.publicId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    UserSaving.countDocuments({ couponPublicId: coupon.publicId }),
  ]);

  const likerIds = likesRaw.map((l) => String(l.userId)).filter(Boolean);
  const commentUserIds = [...new Set(recentCommentsRaw.map((c) => String(c.userId)).filter(Boolean))];
  const allUserIds = [...new Set([...likerIds, ...commentUserIds])];
  const users = await User.find({ _id: { $in: allUserIds } })
    .select("publicId name email")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  res.json({
    coupon: { ...serializeCoupon(coupon), isPublished: coupon.isPublished !== false },
    stats: {
      totalViews,
      views24h,
      views7d,
      totalLikes,
      upvotes: upvoteCount,
      downvotes: downvoteCount,
      comments: coupon.comments || 0,
      savings: savingsCount,
    },
    viewsByDay: viewsByDayRaw.map((d) => ({ date: d._id, count: d.count })),
    likedBy: likesRaw.map((l) => {
      const u = userMap.get(String(l.userId));
      return {
        userName: u ? u.name : "Anonymous",
        userEmail: u ? u.email : undefined,
        userPublicId: u ? u.publicId : undefined,
        likedAt: l.createdAt,
      };
    }),
    recentComments: recentCommentsRaw.map((c) => {
      const u = userMap.get(String(c.userId));
      return {
        id: c.publicId,
        body: c.body,
        userName: u ? u.name : "Anonymous",
        createdAt: c.createdAt,
      };
    }),
  });
});
