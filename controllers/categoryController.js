const Category = require("../models/Category");
const Store = require("../models/Store");
const Coupon = require("../models/Coupon");
const asyncHandler = require("../utils/asyncHandler");
const { serializeCategory } = require("../utils/serialize");
const { pickCategoryPayload } = require("../utils/categoryPayload");

exports.listAll = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json({ categories: categories.map((c) => serializeCategory(c)) });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: req.params.slug.toLowerCase(),
    isActive: true,
  }).lean();
  if (!category) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }
  res.json({ category: serializeCategory(category) });
});

exports.create = asyncHandler(async (req, res) => {
  const body = pickCategoryPayload(req.body || {});
  if (!body.slug || !body.name) {
    const err = new Error("slug and name are required");
    err.status = 400;
    throw err;
  }
  const exists = await Category.findOne({ slug: body.slug });
  if (exists) {
    const err = new Error("Category slug already exists");
    err.status = 409;
    throw err;
  }
  const cat = await Category.create(body);
  res.status(201).json({ category: serializeCategory(cat.toObject()) });
});

exports.updateBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const updates = pickCategoryPayload(req.body || {});
  delete updates.slug;
  const category = await Category.findOneAndUpdate({ slug }, { $set: updates }, {
    new: true,
  }).lean();
  if (!category) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }
  res.json({ category: serializeCategory(category) });
});

exports.destroyBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const cat = await Category.findOne({ slug });
  if (!cat) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }
  await Promise.all([
    Coupon.updateMany({ categorySlug: slug }, { $set: { categorySlug: "" } }),
    Store.updateMany(
      { categoryId: cat._id },
      { $set: { categoryId: null, categorySlug: "", category: "" } }
    ),
  ]);
  await Category.deleteOne({ slug });
  res.status(204).send();
});
