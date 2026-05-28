const Store = require("../models/Store");
const Coupon = require("../models/Coupon");
const asyncHandler = require("../utils/asyncHandler");
const { serializeStore, serializeCoupon } = require("../utils/serialize");
const {
  serializeCouponsForRequester,
} = require("../utils/serializeCouponsForRequester");
const { createPublicId } = require("../utils/publicId");
const { parseListPagination } = require("../utils/listPagination");
const {
  withCountryConstraint,
  storeRestrictedForCountry,
} = require("../utils/countryQuery");
const { normalizeCountriesBody } = require("../utils/normalizeCountriesBody");
const { resolveCategoryForStore } = require("../utils/categoryLink");
const { pickStoreContentFromBody } = require("../utils/storePayload");

const STORE_FIELDS = [
  "publicId",
  "name",
  "slug",
  "logo",
  "couponCount",
  "bestDiscount",
  "category",
  "categorySlug",
  "categoryId",
  "isPublished",
  "websiteUrl",
  "linkRelType",
];

const LINK_REL_TYPES = new Set(["follow", "nofollow", "sponsored", "noreferrer"]);

function pickStorePayload(body) {
  const out = {};
  for (const k of STORE_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  if (out.slug) out.slug = String(out.slug).toLowerCase().trim();
  if (out.websiteUrl !== undefined) {
    out.websiteUrl = String(out.websiteUrl).trim();
  }
  if (out.linkRelType !== undefined) {
    const v = String(out.linkRelType).toLowerCase();
    if (LINK_REL_TYPES.has(v)) out.linkRelType = v;
    else delete out.linkRelType;
  }
  if (body.countries !== undefined) out.countries = normalizeCountriesBody(body.countries);
  if (body.categoryId === null || body.categoryId === "") out.categoryId = null;
  Object.assign(out, pickStoreContentFromBody(body || {}));
  if (out.languageTranslations && !(out.languageTranslations instanceof Map)) {
    out.languageTranslations = new Map(Object.entries(out.languageTranslations));
  }
  return out;
}

async function applyCategoryLink(body) {
  const hasCategoryInput =
    body.categoryId !== undefined ||
    body.categorySlug !== undefined ||
    body.category !== undefined;
  if (!hasCategoryInput) return body;
  const linked = await resolveCategoryForStore(body);
  if (linked) {
    return { ...body, ...linked };
  }
  if (body.categoryId === null || body.categoryId === "") {
    return { ...body, categoryId: null, categorySlug: "", category: "" };
  }
  return body;
}

exports.listAll = asyncHandler(async (req, res) => {
  const { limit, skip } = parseListPagination(req.query);
  const filter = withCountryConstraint({ isPublished: true }, req.query.country);
  const [total, stores] = await Promise.all([
    Store.countDocuments(filter),
    Store.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({
    stores: stores.map((s) => serializeStore(s)),
    total,
    limit,
    skip,
  });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const store = await Store.findOne({ slug, isPublished: true }).lean();
  if (!store) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }
  if (storeRestrictedForCountry(store, req.query.country)) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }
  res.json({ store: serializeStore(store) });
});

/** Coupons for store detail page — same shape as home list. */
exports.listCouponsForStore = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const store = await Store.findOne({ slug, isPublished: true }).lean();
  if (!store) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }
  if (storeRestrictedForCountry(store, req.query.country)) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }
  const filter = withCountryConstraint(
    { storeSlug: slug, isPublished: true },
    req.query.country
  );
  const coupons = await Coupon.find(filter).sort({ upvotes: -1 }).lean();
  res.json({ coupons: await serializeCouponsForRequester(coupons, req.user) });
});

/** Admin — create store (publicId generated if omitted). */
exports.create = asyncHandler(async (req, res) => {
  let body = pickStorePayload(req.body || {});
  body = await applyCategoryLink(body);
  if (!body.name || !body.slug) {
    const err = new Error("name and slug are required");
    err.status = 400;
    throw err;
  }
  if (!body.publicId) body.publicId = createPublicId("st");
  const exists = await Store.findOne({ $or: [{ slug: body.slug }, { publicId: body.publicId }] });
  if (exists) {
    const err = new Error("Store slug or publicId already exists");
    err.status = 409;
    throw err;
  }
  if (body.isPublished !== false) {
    const { assertStorePublishReady } = require("../utils/storePublishValidation");
    assertStorePublishReady({ ...body, faqs: body.faqs || [] });
  }
  const store = await Store.create(body);
  const serialized = serializeStore(store.toObject());
  res.status(201).json({ store: serialized });
  try {
    const { notifyStorePublished } = require("../utils/indexNow");
    notifyStorePublished(store.toObject(), req);
  } catch {
    /* non-blocking */
  }
});

/** Admin — update store by slug. */
exports.updateBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  let updates = pickStorePayload(req.body || {});
  updates = await applyCategoryLink(updates);
  delete updates.slug;
  delete updates.publicId;
  const store = await Store.findOneAndUpdate({ slug }, { $set: updates }, { new: true }).lean();
  if (!store) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }
  if (store.isPublished !== false) {
    const { assertStorePublishReady } = require("../utils/storePublishValidation");
    assertStorePublishReady(store);
  }
  res.json({ store: serializeStore(store) });
  try {
    const { notifyStorePublished } = require("../utils/indexNow");
    notifyStorePublished(store, req);
  } catch {
    /* non-blocking */
  }
});

/** Admin — delete store and its coupons. */
exports.destroyBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const store = await Store.findOne({ slug });
  if (!store) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }
  await Coupon.deleteMany({ storeSlug: slug });
  await Store.deleteOne({ slug });
  res.status(204).send();
});
