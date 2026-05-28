const SEOSettings = require("../models/SEOSettings");
const asyncHandler = require("../utils/asyncHandler");

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await SEOSettings.getSettings();
  res.json({ settings: settings.toObject() });
});

exports.patchSettings = asyncHandler(async (req, res) => {
  const allowed = [
    "siteName",
    "siteUrl",
    "defaultTitle",
    "defaultDescription",
    "twitterHandle",
    "robotsTxt",
    "sitemap",
    "indexNow",
    "googleSiteVerification",
    "bingSiteVerification",
    "searchConsole",
  ];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  const settings = await SEOSettings.findOneAndUpdate({}, { $set: updates }, {
    new: true,
    upsert: true,
  });
  res.json({ settings: settings.toObject() });
});
