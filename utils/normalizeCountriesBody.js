/** Normalize countries from JSON body (array or comma-separated string). */

function normalizeCountriesBody(input) {
  if (input == null) return [];
  const parts = Array.isArray(input)
    ? input
    : String(input).split(/[\s,]+/);
  const out = [
    ...new Set(
      parts
        .map((c) => String(c).trim().toUpperCase())
        .filter((c) => /^[A-Z]{2}$/.test(c))
    ),
  ];
  return out;
}

module.exports = { normalizeCountriesBody };
