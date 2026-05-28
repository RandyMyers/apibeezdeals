const BlogPost = require("../models/BlogPost");
const asyncHandler = require("../utils/asyncHandler");
const { slugify } = require("../utils/slugify");
const { computeReadMins } = require("../utils/blogHelpers");
const { serializeBlogPost } = require("../utils/serialize");
const { pickSeoFromBody, pickI18nFromBody } = require("../utils/blogPayload");

const BLOG_FIELDS = [
  "slug",
  "title",
  "excerpt",
  "content",
  "featuredImage",
  "readMins",
  "authorName",
  "isPublished",
  "publishedAt",
];

function pickBlogPayload(body) {
  const out = {};
  for (const k of BLOG_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  if (out.slug) out.slug = String(out.slug).toLowerCase().trim();
  if (out.title) out.title = String(out.title).trim();
  if (out.excerpt !== undefined) out.excerpt = String(out.excerpt);
  if (out.content !== undefined) out.content = String(out.content);
  if (out.featuredImage !== undefined) out.featuredImage = String(out.featuredImage);
  if (out.authorName !== undefined) out.authorName = String(out.authorName).trim();
  if (out.readMins !== undefined) out.readMins = Math.max(1, Number(out.readMins) || 1);
  if (out.isPublished !== undefined) out.isPublished = Boolean(out.isPublished);
  if (out.publishedAt !== undefined) {
    out.publishedAt = out.publishedAt ? new Date(out.publishedAt) : null;
  }
  Object.assign(out, pickSeoFromBody(body));
  const i18n = pickI18nFromBody(body);
  if (i18n) out.i18n = i18n;
  return out;
}

function applyPublishDefaults(payload, existing) {
  const next = { ...payload };
  const willPublish =
    next.isPublished !== undefined ? next.isPublished : existing?.isPublished;
  if (willPublish && !next.publishedAt && !existing?.publishedAt) {
    next.publishedAt = new Date();
  }
  if (willPublish === false) {
    next.publishedAt = null;
  }
  if (next.content !== undefined || next.excerpt !== undefined) {
    const text = next.content ?? existing?.content ?? "";
    const excerpt = next.excerpt ?? existing?.excerpt ?? "";
    if (next.readMins === undefined) {
      next.readMins = computeReadMins(`${excerpt}\n${text}`);
    }
  }
  return next;
}

exports.listPublished = asyncHandler(async (req, res) => {
  const rows = await BlogPost.find({ isPublished: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();
  res.json({ posts: rows.map((r) => serializeBlogPost(r)) });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({
    slug: req.params.slug.toLowerCase(),
    isPublished: true,
  }).lean();
  if (!post) {
    const err = new Error("Blog post not found");
    err.status = 404;
    throw err;
  }
  res.json({ post: serializeBlogPost(post) });
});

exports.create = asyncHandler(async (req, res) => {
  let body = pickBlogPayload(req.body || {});
  if (!body.title) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  if (!body.slug) body.slug = slugify(body.title);
  if (!body.slug) {
    const err = new Error("slug is required");
    err.status = 400;
    throw err;
  }
  const exists = await BlogPost.findOne({ slug: body.slug });
  if (exists) {
    const err = new Error("Blog slug already exists");
    err.status = 409;
    throw err;
  }
  body = applyPublishDefaults(body, null);
  const post = await BlogPost.create(body);
  const serialized = serializeBlogPost(post.toObject(), {
    includeUnpublished: true,
    admin: true,
  });
  res.status(201).json({ post: serialized });
  if (post.isPublished) {
    try {
      const { notifyBlogPublished } = require("../utils/indexNow");
      notifyBlogPublished(post.toObject(), req);
    } catch {
      /* non-blocking */
    }
  }
});

exports.updateBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const existing = await BlogPost.findOne({ slug });
  if (!existing) {
    const err = new Error("Blog post not found");
    err.status = 404;
    throw err;
  }
  let updates = pickBlogPayload(req.body || {});
  delete updates.slug;
  updates = applyPublishDefaults(updates, existing.toObject());
  const post = await BlogPost.findOneAndUpdate(
    { slug },
    { $set: updates },
    { new: true }
  ).lean();
  res.json({
    post: serializeBlogPost(post, { includeUnpublished: true, admin: true }),
  });
  if (post.isPublished) {
    try {
      const { notifyBlogPublished } = require("../utils/indexNow");
      notifyBlogPublished(post, req);
    } catch {
      /* non-blocking */
    }
  }
});

exports.destroyBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const post = await BlogPost.findOne({ slug });
  if (!post) {
    const err = new Error("Blog post not found");
    err.status = 404;
    throw err;
  }
  await BlogPost.deleteOne({ slug });
  res.status(204).send();
});
