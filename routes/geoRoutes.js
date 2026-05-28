const express = require("express");

const router = express.Router();

/**
 * GET /api/v1/geo/ip — proxy geo lookup so the browser avoids CORS to ipapi.co.
 */
router.get("/ip", async (req, res) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    const raw =
      typeof forwarded === "string"
        ? forwarded.split(",")[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : null;
    const clientIp = raw || req.ip;
    const isLocal =
      !clientIp ||
      clientIp === "::1" ||
      clientIp === "127.0.0.1" ||
      String(clientIp).startsWith("::ffff:127.");

    const url = isLocal
      ? "https://ipapi.co/json/"
      : `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(t);

    if (!r.ok) {
      throw new Error(`upstream ${r.status}`);
    }
    const data = await r.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({
      message: "Geolocation lookup failed",
      error: error.message,
    });
  }
});

module.exports = router;
