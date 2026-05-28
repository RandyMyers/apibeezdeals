const ActivityLog = require("../models/ActivityLog");
const Visitor = require("../models/Visitor");
const asyncHandler = require("../utils/asyncHandler");
const { createPublicId } = require("../utils/publicId");
const { resolveCountryCode } = require("../utils/clientGeo");

function detectDeviceType(userAgent, platform) {
  const ua = String(userAgent || "").toLowerCase();
  const p = String(platform || "").toLowerCase();
  if (/ipad|tablet/.test(ua) || p === "ipad") return "tablet";
  if (/mobile|iphone|android/.test(ua) || p === "iphone" || p === "android") return "mobile";
  return "desktop";
}

async function upsertVisitorFromActivity(req, payload) {
  const trackingKey = String(payload.anonKey || "").trim().slice(0, 128);
  if (!trackingKey) return;

  const countryCode = resolveCountryCode(req, payload);
  const countryName = String(payload.countryName || "").trim().slice(0, 120);
  const now = new Date();

  const update = {
    $inc: { visitCount: 1 },
    $set: {
      lastSeenAt: now,
      lastPath: payload.path,
      lastTitle: payload.title || "",
      deviceType: detectDeviceType(payload.userAgent, payload.platform),
      platform: String(payload.platform || "").slice(0, 64),
      browserLanguage: String(payload.browserLanguage || "").slice(0, 16),
      userAgent: String(payload.userAgent || "").slice(0, 512),
    },
  };

  if (countryCode) {
    update.$set.countryCode = countryCode;
    if (countryName) update.$set.country = countryName;
  }
  if (payload.city) update.$set.city = String(payload.city).slice(0, 120);
  if (payload.region) update.$set.region = String(payload.region).slice(0, 120);
  if (payload.affiliateCode) {
    update.$set.affiliateCode = String(payload.affiliateCode).slice(0, 64);
  }
  if (req.user) {
    update.$set.userId = req.user._id;
    update.$set.userPublicId = req.user.publicId || "";
  }

  await Visitor.findOneAndUpdate(
    { trackingKey },
    {
      ...update,
      $setOnInsert: {
        trackingKey,
        firstSeenAt: now,
        country: countryName || countryCode || "",
        countryCode: countryCode || "",
      },
    },
    { upsert: true, new: true }
  );
}

exports.log = asyncHandler(async (req, res) => {
  const path = String(req.body?.path || "").trim().slice(0, 2048);
  if (!path) {
    const err = new Error("path is required");
    err.status = 400;
    throw err;
  }
  const title = String(req.body?.title || "").trim().slice(0, 500);
  const referrer = String(req.body?.referrer || "").trim().slice(0, 2048);
  const anonKey = String(req.body?.anonKey || "").trim().slice(0, 128);
  const affiliateCode = String(req.body?.affiliateCode || req.body?.ref || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 64);
  const userAgent = String(req.get("user-agent") || "").slice(0, 512);
  const countryCode = resolveCountryCode(req, req.body);

  const doc = {
    publicId: createPublicId("act"),
    path,
    title,
    referrer,
    country: countryCode,
    userAgent,
    anonKey,
    affiliateCode,
  };
  if (req.user) {
    doc.userId = req.user._id;
    doc.userPublicId = req.user.publicId || "";
  }

  await ActivityLog.create(doc);

  try {
    const socketService = require("../services/socketService");
    const payload = {
      path: doc.path,
      title: doc.title,
      country: doc.country,
      anonKey: doc.anonKey,
      userPublicId: doc.userPublicId || null,
      createdAt: new Date().toISOString(),
    };
    socketService.emitToAdmin("newPageView", payload);
    socketService.emitToAdmin("newView", payload);
  } catch {
    /* socket optional */
  }

  await upsertVisitorFromActivity(req, {
    path,
    title,
    anonKey,
    affiliateCode,
    userAgent,
    countryCode,
    countryName: req.body?.countryName,
    city: req.body?.city,
    region: req.body?.region,
    platform: req.body?.platform,
    browserLanguage: req.body?.browserLanguage,
  });

  res.status(201).json({ ok: true });
});
