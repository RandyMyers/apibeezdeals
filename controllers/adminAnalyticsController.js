const Visitor = require("../models/Visitor");
const ActivityLog = require("../models/ActivityLog");
const asyncHandler = require("../utils/asyncHandler");
const {
  daysAgo,
  aggregateTopPages,
  aggregateCountriesFromActivity,
  aggregateCountriesFromVisitors,
  countActivityViews,
  countUniqueAnonKeys,
} = require("../utils/analyticsAggregate");

exports.overview = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = daysAgo(days);
  const since24h = daysAgo(1);
  const since7d = daysAgo(7);

  const [
    totalVisitors,
    visitors24h,
    pageViews,
    pageViews24h,
    pageViews7d,
    uniqueVisitors,
    uniqueVisitors24h,
    topPages,
    countriesByActivity,
    countriesByVisitor,
    viewsByDay,
  ] = await Promise.all([
    Visitor.countDocuments({}),
    Visitor.countDocuments({ lastSeenAt: { $gte: since24h } }),
    countActivityViews(since),
    countActivityViews(since24h),
    countActivityViews(since7d),
    countUniqueAnonKeys(since),
    countUniqueAnonKeys(since24h),
    aggregateTopPages(days, 10),
    aggregateCountriesFromActivity(days, 10),
    aggregateCountriesFromVisitors(10),
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    days,
    totals: {
      visitors: totalVisitors,
      visitors24h,
      pageViews,
      pageViews24h,
      pageViews7d,
      uniqueVisitors,
      uniqueVisitors24h,
    },
    topPages,
    countriesByActivity: countriesByActivity.map((c) => ({
      countryCode: c.countryCode,
      views: c.views,
      uniqueVisitors: c.uniqueVisitors,
    })),
    countriesByVisitor,
    viewsByDay: viewsByDay.map((d) => ({ date: d._id, views: d.views })),
  });
});

exports.topPages = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const pages = await aggregateTopPages(days, limit);
  res.json({ pages, days });
});

exports.countries = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const [byActivity, byVisitor] = await Promise.all([
    aggregateCountriesFromActivity(days, limit),
    aggregateCountriesFromVisitors(limit),
  ]);
  res.json({
    days,
    byActivity: byActivity.map((c) => ({
      countryCode: c.countryCode,
      views: c.views,
      uniqueVisitors: c.uniqueVisitors,
    })),
    byVisitor,
  });
});

exports.listVisitors = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip = Math.min(Number(req.query.skip) || 0, 10000);
  const country = req.query.country ? String(req.query.country).trim().toUpperCase() : "";
  const device = req.query.device ? String(req.query.device).trim().toLowerCase() : "";
  const q = {};
  if (country) q.countryCode = country;
  if (device) q.deviceType = device;

  const [rows, total] = await Promise.all([
    Visitor.find(q).sort({ lastSeenAt: -1 }).skip(skip).limit(limit).lean(),
    Visitor.countDocuments(q),
  ]);

  res.json({
    visitors: rows.map((v) => ({
      id: String(v._id),
      trackingKey: v.trackingKey,
      country: v.country || undefined,
      countryCode: v.countryCode || undefined,
      city: v.city || undefined,
      region: v.region || undefined,
      deviceType: v.deviceType || undefined,
      platform: v.platform || undefined,
      visitCount: v.visitCount,
      lastPath: v.lastPath || undefined,
      lastTitle: v.lastTitle || undefined,
      userPublicId: v.userPublicId || undefined,
      affiliateCode: v.affiliateCode || undefined,
      firstSeenAt: v.firstSeenAt,
      lastSeenAt: v.lastSeenAt,
    })),
    total,
    skip,
    limit,
  });
});

/** Active visitors from recent page-view logs (last N minutes). */
exports.live = asyncHandler(async (req, res) => {
  const minutes = Math.min(Math.max(Number(req.query.minutes) || 5, 1), 30);
  const since = new Date(Date.now() - minutes * 60 * 1000);

  const logs = await ActivityLog.find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const keys = [...new Set(logs.map((l) => l.anonKey).filter(Boolean))];
  const visitors = keys.length
    ? await Visitor.find({ trackingKey: { $in: keys } }).lean()
    : [];
  const visitorByKey = new Map(visitors.map((v) => [v.trackingKey, v]));

  const map = new Map();
  for (const log of logs) {
    const key = log.anonKey || `anon-${String(log._id)}`;
    const v = visitorByKey.get(log.anonKey);
    if (!map.has(key)) {
      map.set(key, {
        trackingKey: log.anonKey || null,
        userPublicId: log.userPublicId || null,
        country: v?.country || "",
        countryCode: log.country || v?.countryCode || "",
        deviceType: v?.deviceType || "",
        currentPage: log.path,
        pageTitle: log.title || "",
        lastActivity: log.createdAt,
        sessionStart: log.createdAt,
        pageViewsInSession: 1,
        username: log.userPublicId ? log.userPublicId : "Guest",
      });
    } else {
      const row = map.get(key);
      row.pageViewsInSession += 1;
      if (new Date(log.createdAt) > new Date(row.lastActivity)) {
        row.lastActivity = log.createdAt;
        row.currentPage = log.path;
        row.pageTitle = log.title || "";
      }
      if (new Date(log.createdAt) < new Date(row.sessionStart)) {
        row.sessionStart = log.createdAt;
      }
    }
  }

  const liveVisitors = [...map.values()]
    .map((row) => {
      const timeOnPage = Math.floor(
        (Date.now() - new Date(row.lastActivity).getTime()) / 1000
      );
      const sessionDuration = Math.floor(
        (Date.now() - new Date(row.sessionStart).getTime()) / 1000
      );
      return {
        ...row,
        timeOnPage,
        sessionDuration,
        isActive: timeOnPage < minutes * 60,
      };
    })
    .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

  res.json({
    success: true,
    data: liveVisitors,
    count: liveVisitors.length,
    timestamp: new Date().toISOString(),
    minutes,
  });
});
