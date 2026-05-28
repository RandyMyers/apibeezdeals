/**
 * Audit and repair Store ↔ Category links in MongoDB.
 *
 * Usage:
 *   node scripts/auditStoreCategories.js           # report only
 *   node scripts/auditStoreCategories.js --fix     # create missing categories + link stores
 *   node scripts/auditStoreCategories.js --json    # machine-readable report
 *
 * npm run audit:store-categories
 * npm run audit:store-categories:fix
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const Category = require("../models/Category");
const { toSlug, storeFieldsFromCategory } = require("../utils/categoryLink");

const args = new Set(process.argv.slice(2));
const FIX = args.has("--fix");
const JSON_OUT = args.has("--json");

/** Map legacy / seed display names → existing category slug when names differ. */
const NAME_TO_SLUG = {
  shopping: "electronics",
  "ride-hailing": "travel",
  "food delivery": "restaurants-dining",
  "food/goods delivery": "restaurants-dining",
  activewear: "fashion",
  "fast fashion": "fashion",
  apparel: "fashion",
  "activewear/fashion": "fashion",
  "healthcare apparel": "fashion",
  "department store": "fashion",
  "women's fashion": "fashion",
  "sports apparel": "fashion",
  skincare: "health-beauty",
  "health & wellness": "health-beauty",
  "health & beauty": "health-beauty",
  fitness: "health-beauty",
  supplements: "health-beauty",
  "fitness equipment": "health-beauty",
  "fitness classes": "health-beauty",
  "fitness & wellness": "health-beauty",
  "supplements/wellness": "health-beauty",
  "mental health": "health-beauty",
  office: "electronics",
  eyewear: "health-beauty",
  "pet supplies": "pet-supplies",
  "general retail": "electronics",
  organization: "home-garden",
  "home goods": "home-garden",
  "personal care": "health-beauty",
  "sporting goods": "sports-outdoors",
  "sports & outdoors": "sports-outdoors",
  "home improvement": "home-garden",
  "tools & hardware": "home-garden",
  furniture: "home-garden",
  "home decor": "home-garden",
  "meal kits": "food-beverages",
  "food & beverages": "food-beverages",
  software: "software-apps",
  "software & apps": "software-apps",
  cashback: "financial-services",
  "financial services": "financial-services",
  "luxury goods/watches": "jewelry-watches",
  "jewelry & watches": "jewelry-watches",
  "promotional products": "office-supplies",
  "office supplies": "office-supplies",
  marketplace: "electronics",
  travel: "travel",
  grocery: "grocery",
  "makeup & cosmetics": "makeup-cosmetics",
  "hotels & accommodation": "hotels-accommodation",
  "bedding & bath": "bedding-bath",
  restaurants: "restaurants-dining",
  "restaurants & dining": "restaurants-dining",
};

function buildCategoryIndexes(categories) {
  const bySlug = new Map();
  const byName = new Map();
  for (const cat of categories) {
    bySlug.set(cat.slug, cat);
    byName.set(String(cat.name).toLowerCase().trim(), cat);
  }
  return { bySlug, byName };
}

function resolveTargetSlug(store) {
  const slugFromField = toSlug(store.categorySlug);
  if (slugFromField && NAME_TO_SLUG[slugFromField]) return NAME_TO_SLUG[slugFromField];
  if (slugFromField) return slugFromField;

  const nameKey = String(store.category || "").toLowerCase().trim();
  if (nameKey && NAME_TO_SLUG[nameKey]) return NAME_TO_SLUG[nameKey];
  if (nameKey) return toSlug(store.category);

  return "";
}

function classifyStore(store, indexes) {
  const issues = [];
  let targetSlug = resolveTargetSlug(store);

  if (store.categoryId) {
    const linked = indexes.byId.get(String(store.categoryId));
    if (!linked) {
      issues.push("orphan_categoryId");
    } else if (targetSlug && linked.slug !== targetSlug) {
      issues.push("categoryId_slug_mismatch");
      targetSlug = linked.slug;
    } else {
      targetSlug = linked.slug;
    }
  }

  let targetCat = targetSlug ? indexes.bySlug.get(targetSlug) : null;

  if (!targetCat && targetSlug) {
    issues.push("missing_category");
  }

  if (!store.categoryId && targetSlug) {
    issues.push("missing_categoryId");
  }

  if (store.categoryId && targetCat && String(store.categoryId) !== String(targetCat._id)) {
    issues.push("wrong_categoryId");
  }

  if (targetCat) {
    if (store.categorySlug && store.categorySlug !== targetCat.slug) {
      issues.push("stale_categorySlug");
    }
    if (store.category && store.category !== targetCat.name) {
      issues.push("stale_category_name");
    }
  }

  if (!targetSlug && !store.categoryId) {
    issues.push("no_category_data");
  }

  return { store, targetSlug, targetCat, issues };
}

async function ensureCategory(targetSlug, displayName, indexes, stats) {
  let cat = indexes.bySlug.get(targetSlug);
  if (cat) return cat;

  const name = displayName || targetSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (!FIX) {
    stats.categoriesWouldCreate.push({ slug: targetSlug, name });
    return null;
  }

  cat = await Category.create({
    slug: targetSlug,
    name,
    description: "",
    isActive: true,
    couponCount: 0,
  });
  indexes.bySlug.set(cat.slug, cat);
  indexes.byName.set(String(cat.name).toLowerCase(), cat);
  indexes.byId.set(String(cat._id), cat);
  stats.categoriesCreated.push({ slug: cat.slug, name: cat.name });
  return cat;
}

async function run() {
  if (!process.env.MONGO_URL) {
    console.error("Set MONGO_URL in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL);

  try {
    const [categories, stores] = await Promise.all([
      Category.find({}).sort({ slug: 1 }).lean(),
      Store.find({}).sort({ name: 1 }).lean(),
    ]);

    const indexes = buildCategoryIndexes(categories);
    indexes.byId = new Map(categories.map((c) => [String(c._id), c]));

    const stats = {
      categoriesTotal: categories.length,
      storesTotal: stores.length,
      storesOk: 0,
      storesWithIssues: 0,
      categoriesCreated: [],
      categoriesWouldCreate: [],
      storesFixed: [],
      storesUnfixable: [],
      orphanCategoryIds: [],
      categoriesWithNoStores: [],
      issueCounts: {},
    };

    const rows = [];

    for (const store of stores) {
      const { targetSlug, targetCat, issues } = classifyStore(store, indexes);
      for (const i of issues) {
        stats.issueCounts[i] = (stats.issueCounts[i] || 0) + 1;
      }

      let cat = targetCat;
      if (targetSlug && !cat) {
        cat = await ensureCategory(targetSlug, store.category, indexes, stats);
      }

      const row = {
        storeSlug: store.slug,
        storeName: store.name,
        categoryId: store.categoryId ? String(store.categoryId) : null,
        categorySlug: store.categorySlug || "",
        category: store.category || "",
        targetSlug: targetSlug || null,
        targetCategoryName: cat?.name || null,
        issues,
      };
      rows.push(row);

      if (issues.length === 0) {
        stats.storesOk++;
        continue;
      }
      stats.storesWithIssues++;

      if (FIX && cat && issues.some((i) => i !== "no_category_data")) {
        const fields = storeFieldsFromCategory(cat);
        await Store.updateOne({ _id: store._id }, { $set: fields });
        stats.storesFixed.push({
          slug: store.slug,
          categorySlug: fields.categorySlug,
          categoryId: String(fields.categoryId),
        });
      } else if (issues.includes("no_category_data") || (targetSlug && !cat && !FIX)) {
        stats.storesUnfixable.push({
          slug: store.slug,
          name: store.name,
          issues,
        });
      }
    }

    // Categories with zero linked stores (after fix pass, re-query if fixed)
    const storeCounts = await Store.aggregate([
      { $match: { categoryId: { $ne: null } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]);
    const countByCat = new Map(storeCounts.map((r) => [String(r._id), r.count]));
    for (const cat of indexes.bySlug.values()) {
      if (!countByCat.get(String(cat._id))) {
        stats.categoriesWithNoStores.push({ slug: cat.slug, name: cat.name });
      }
    }

    const orphanIds = stores.filter((s) => {
      if (!s.categoryId) return false;
      return !indexes.byId.has(String(s.categoryId));
    });
    stats.orphanCategoryIds = orphanIds.map((s) => ({
      slug: s.slug,
      categoryId: String(s.categoryId),
    }));

    if (JSON_OUT) {
      console.log(JSON.stringify({ stats, rows }, null, 2));
      return;
    }

    console.log("\n=== Store ↔ Category audit ===\n");
    console.log(`Categories in DB : ${stats.categoriesTotal}`);
    console.log(`Stores in DB     : ${stats.storesTotal}`);
    console.log(`Stores OK        : ${stats.storesOk}`);
    console.log(`Stores w/ issues : ${stats.storesWithIssues}`);
    console.log(`Mode             : ${FIX ? "FIX (writes enabled)" : "CHECK only"}\n`);

    if (Object.keys(stats.issueCounts).length) {
      console.log("Issue counts:");
      for (const [k, v] of Object.entries(stats.issueCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${k}: ${v}`);
      }
      console.log("");
    }

    if (stats.categoriesWouldCreate.length) {
      console.log(`Categories to create (run with --fix): ${stats.categoriesWouldCreate.length}`);
      stats.categoriesWouldCreate.slice(0, 20).forEach((c) => {
        console.log(`  + ${c.slug} (${c.name})`);
      });
      if (stats.categoriesWouldCreate.length > 20) {
        console.log(`  ... and ${stats.categoriesWouldCreate.length - 20} more`);
      }
      console.log("");
    }

    if (stats.categoriesCreated.length) {
      console.log(`Categories created: ${stats.categoriesCreated.length}`);
      stats.categoriesCreated.forEach((c) => console.log(`  + ${c.slug}`));
      console.log("");
    }

    if (stats.storesFixed.length) {
      console.log(`Stores linked/updated: ${stats.storesFixed.length}`);
      stats.storesFixed.slice(0, 15).forEach((s) => {
        console.log(`  ✓ ${s.slug} → ${s.categorySlug}`);
      });
      if (stats.storesFixed.length > 15) {
        console.log(`  ... and ${stats.storesFixed.length - 15} more`);
      }
      console.log("");
    }

    if (stats.storesUnfixable.length) {
      console.log(`Stores needing manual review: ${stats.storesUnfixable.length}`);
      stats.storesUnfixable.slice(0, 15).forEach((s) => {
        console.log(`  ? ${s.slug} (${s.name}) — ${s.issues.join(", ")}`);
      });
      console.log("");
    }

    if (stats.orphanCategoryIds.length) {
      console.log(`Orphan categoryId on stores: ${stats.orphanCategoryIds.length}`);
      stats.orphanCategoryIds.slice(0, 10).forEach((s) => {
        console.log(`  ${s.slug} → ${s.categoryId}`);
      });
      console.log("");
    }

    if (stats.categoriesWithNoStores.length) {
      console.log(`Categories with no stores: ${stats.categoriesWithNoStores.length}`);
      stats.categoriesWithNoStores.forEach((c) => console.log(`  - ${c.slug} (${c.name})`));
      console.log("");
    }

    console.log(
      FIX
        ? "Done. Re-run without --fix to verify."
        : "No changes written. Run: npm run audit:store-categories:fix"
    );
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("Audit failed:", err.message);
  process.exit(1);
});
