/**
 * Optional ?country=XX query (ISO 3166-1 alpha-2). Used to filter catalog
 * where `countries` is empty (worldwide) or contains XX.
 */

function normalizeCountryQuery(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(s)) return null;
  return s;
}

/** Merge Mongo filter so entities with no restriction or matching code are included. */
function withCountryConstraint(baseFilter, countryCode) {
  const code = normalizeCountryQuery(countryCode);
  if (!code) return baseFilter;
  return {
    $and: [
      baseFilter,
      {
        $or: [
          { countries: { $exists: false } },
          { countries: { $size: 0 } },
          { countries: code },
        ],
      },
    ],
  };
}

/** Store or coupon doc: restricted when `countries` is non-empty and code is not listed. */
function restrictedForCountry(doc, countryCode) {
  const code = normalizeCountryQuery(countryCode);
  if (!code || !doc) return false;
  const list = doc.countries;
  if (!list || !Array.isArray(list) || list.length === 0) return false;
  return !list.map((c) => String(c).toUpperCase()).includes(code);
}

function storeRestrictedForCountry(storeDoc, countryCode) {
  return restrictedForCountry(storeDoc, countryCode);
}

module.exports = {
  normalizeCountryQuery,
  withCountryConstraint,
  restrictedForCountry,
  storeRestrictedForCountry,
};
