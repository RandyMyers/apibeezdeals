/** Browser origins allowed for CORS and Socket.IO (override with CLIENT_ORIGIN). */
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://dealbeez.com",
  "https://www.dealbeez.com",
];

function parseClientOrigins(envValue) {
  const raw =
    envValue ||
    process.env.CLIENT_ORIGIN ||
    DEFAULT_CLIENT_ORIGINS.join(",");
  const list = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(list.length ? list : DEFAULT_CLIENT_ORIGINS)];
}

module.exports = { DEFAULT_CLIENT_ORIGINS, parseClientOrigins };
