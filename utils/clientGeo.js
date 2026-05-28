/** Resolve visitor country from CDN/proxy headers or request body. */
function headerCountry(req) {
  const h = req.headers || {};
  const raw = String(
    h["cf-ipcountry"] || h["CF-IPCountry"] || h["x-vercel-ip-country"] || ""
  )
    .trim()
    .toUpperCase();
  if (/^[A-Z]{2}$/.test(raw) && raw !== "XX" && raw !== "T1") return raw;
  return "";
}

function bodyCountry(body) {
  const code = String(body?.countryCode || body?.country || "")
    .trim()
    .toUpperCase()
    .slice(0, 8);
  if (/^[A-Z]{2}$/.test(code)) return code;
  return "";
}

function resolveCountryCode(req, body = {}) {
  return bodyCountry(body) || headerCountry(req) || "";
}

module.exports = { headerCountry, bodyCountry, resolveCountryCode };
