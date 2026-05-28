const ActivityLog = require("../models/ActivityLog");
const Visitor = require("../models/Visitor");

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function matchSince(days) {
  const d = Number(days) || 30;
  return { createdAt: { $gte: daysAgo(Math.min(Math.max(d, 1), 365)) } };
}

async function aggregateTopPages(days = 30, limit = 20) {
  const since = matchSince(days);
  const rows = await ActivityLog.aggregate([
    { $match: { ...since, path: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: "$path",
        viewCount: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$anonKey" },
        lastViewed: { $max: "$createdAt" },
        sampleTitle: { $last: "$title" },
      },
    },
    {
      $project: {
        pagePath: "$_id",
        viewCount: 1,
        uniqueVisitors: {
          $size: {
            $filter: {
              input: "$uniqueVisitors",
              as: "k",
              cond: { $and: [{ $ne: ["$$k", null] }, { $ne: ["$$k", ""] }] },
            },
          },
        },
        lastViewed: 1,
        sampleTitle: 1,
      },
    },
    { $sort: { viewCount: -1 } },
    { $limit: Math.min(Number(limit) || 20, 100) },
  ]);
  return rows.map((r) => ({
    pagePath: r.pagePath,
    viewCount: r.viewCount,
    uniqueVisitors: r.uniqueVisitors,
    lastViewed: r.lastViewed,
    title: r.sampleTitle || "",
  }));
}

async function aggregateCountriesFromActivity(days = 30, limit = 20) {
  const since = matchSince(days);
  const rows = await ActivityLog.aggregate([
    {
      $match: {
        ...since,
        country: { $exists: true, $nin: ["", null] },
      },
    },
    {
      $group: {
        _id: "$country",
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$anonKey" },
      },
    },
    {
      $project: {
        countryCode: "$_id",
        views: 1,
        uniqueVisitors: {
          $size: {
            $filter: {
              input: "$uniqueVisitors",
              as: "k",
              cond: { $and: [{ $ne: ["$$k", null] }, { $ne: ["$$k", ""] }] },
            },
          },
        },
      },
    },
    { $sort: { views: -1 } },
    { $limit: Math.min(Number(limit) || 20, 100) },
  ]);
  return rows;
}

async function aggregateCountriesFromVisitors(limit = 20) {
  const rows = await Visitor.aggregate([
    { $match: { countryCode: { $nin: ["", null] } } },
    {
      $group: {
        _id: "$countryCode",
        country: { $first: "$country" },
        visitors: { $sum: 1 },
        pageViews: { $sum: "$visitCount" },
      },
    },
    { $sort: { visitors: -1 } },
    { $limit: Math.min(Number(limit) || 20, 100) },
  ]);
  return rows.map((r) => ({
    countryCode: r._id,
    country: r.country || r._id,
    visitors: r.visitors,
    pageViews: r.pageViews,
  }));
}

async function countActivityViews(sinceDate) {
  const q = sinceDate ? { createdAt: { $gte: sinceDate } } : {};
  return ActivityLog.countDocuments(q);
}

async function countUniqueAnonKeys(sinceDate) {
  const match = sinceDate ? { createdAt: { $gte: sinceDate } } : {};
  const rows = await ActivityLog.aggregate([
    { $match: { ...match, anonKey: { $nin: ["", null] } } },
    { $group: { _id: "$anonKey" } },
    { $count: "total" },
  ]);
  return rows[0]?.total || 0;
}

module.exports = {
  daysAgo,
  aggregateTopPages,
  aggregateCountriesFromActivity,
  aggregateCountriesFromVisitors,
  countActivityViews,
  countUniqueAnonKeys,
};
