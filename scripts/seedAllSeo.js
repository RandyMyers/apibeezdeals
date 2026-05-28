/**
 * Run all SEO-related seeds in order.
 * Usage: npm run seed:all-seo
 */
const { spawnSync } = require("child_process");
const path = require("path");

const scripts = [
  "seedSeoSettings.js",
  "seedLegalPages.js",
  "seedCategorySeo.js",
  "seedStoresSeoBackfill.js",
  "seedTripComStore.js",
  "seedCouponsForStores.js",
  "seedBlogPostsIfEmpty.js",
];

const dir = __dirname;

for (const file of scripts) {
  console.log(`\n=== ${file} ===`);
  const res = spawnSync(process.execPath, [path.join(dir, file)], {
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) {
    console.error(`Failed: ${file}`);
    process.exit(res.status || 1);
  }
}

console.log("\nAll SEO seeds completed.");
