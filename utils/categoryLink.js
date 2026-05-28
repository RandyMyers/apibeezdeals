const Category = require("../models/Category");

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Denormalized store fields from a Category document. */
function storeFieldsFromCategory(cat) {
  if (!cat) {
    return { categoryId: null, categorySlug: "", category: "" };
  }
  return {
    categoryId: cat._id,
    categorySlug: cat.slug,
    category: cat.name,
  };
}

/**
 * Resolve category for a store payload (create/update).
 * Accepts categoryId, categorySlug, or category (display name).
 */
async function resolveCategoryForStore(body = {}) {
  if (body.categoryId) {
    const cat = await Category.findById(body.categoryId).lean();
    if (!cat) {
      const err = new Error("Category not found");
      err.status = 400;
      throw err;
    }
    return storeFieldsFromCategory(cat);
  }

  const slug = body.categorySlug ? toSlug(body.categorySlug) : "";
  if (slug) {
    const cat = await Category.findOne({ slug }).lean();
    if (!cat) {
      const err = new Error(`Category not found for slug "${slug}"`);
      err.status = 400;
      throw err;
    }
    return storeFieldsFromCategory(cat);
  }

  const name = String(body.category || "").trim();
  if (name) {
    const slugFromName = toSlug(name);
    let cat = await Category.findOne({
      $or: [{ name: new RegExp(`^${escapeRegex(name)}$`, "i") }, { slug: slugFromName }],
    }).lean();
    if (!cat && body.createCategoryIfMissing) {
      cat = (
        await Category.create({
          slug: slugFromName,
          name,
          description: "",
          isActive: true,
        })
      ).toObject();
    }
    if (!cat) {
      const err = new Error(`Category not found for "${name}"`);
      err.status = 400;
      throw err;
    }
    return storeFieldsFromCategory(cat);
  }

  return null;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  toSlug,
  storeFieldsFromCategory,
  resolveCategoryForStore,
};
