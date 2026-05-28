const http = require("http");
const os = require("os");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");

const errorMiddleware = require("./middleware/errorMiddleware");
const {
  authRateLimit,
  formsRateLimit,
  generalRateLimit,
} = require("./middleware/rateLimit");

const categoryRoutes = require("./routes/categoryRoutes");
const storeRoutes = require("./routes/storeRoutes");
const couponRoutes = require("./routes/couponRoutes");
const searchRoutes = require("./routes/searchRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const activityRoutes = require("./routes/activityRoutes");
const couponSubmissionRoutes = require("./routes/couponSubmissionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const geoRoutes = require("./routes/geoRoutes");
const blogRoutes = require("./routes/blogRoutes");
const legalPageRoutes = require("./routes/legalPageRoutes");
const sitemapRoutes = require("./routes/sitemapRoutes");
const apiSitemapRoutes = require("./routes/apiSitemapRoutes");
const robotsRoutes = require("./routes/robotsRoutes");
const llmsRoutes = require("./routes/llmsRoutes");
const indexNowRoutes = require("./routes/indexNowRoutes");

dotenv.config();

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
  process.exit(1);
});

if (!process.env.MONGO_URL) {
  console.error("MONGO_URL is not set in environment");
  process.exit(1);
}

mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10_000 })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error.message);
    process.exit(1);
  });

const app = express();
const PORT = Number(process.env.PORT) || 5000;

if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const defaultClientOrigins = ["http://localhost:3000", "http://localhost:3001"];
const clientOriginRaw =
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3000,http://localhost:3001";
const allowedOrigins = [
  ...new Set(
    clientOriginRaw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  ),
];
const corsOrigins = allowedOrigins.length ? allowedOrigins : defaultClientOrigins;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
    createParentPath: true,
  })
);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "coupondealz-server",
    time: new Date().toISOString(),
  });
});

app.use("/api/v1", (req, res, next) => {
  req.apiVersion = "v1";
  next();
});

app.get("/api/v1/health", (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? "ok" : "degraded",
    service: "coupondealz-server",
    db: dbOk ? "connected" : "disconnected",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

app.use("/api/v1", generalRateLimit);
app.use("/api/v1/auth", authRateLimit, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/coupon-submissions", couponSubmissionRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/contact", formsRateLimit, contactRoutes);
app.use("/api/v1/newsletter", formsRateLimit, newsletterRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/store", storeRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/geo", geoRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/content", legalPageRoutes);
app.use("/api/v1/sitemap", apiSitemapRoutes);

// Sitemap, robots.txt, llms.txt at root (not under /api/v1)
app.use("/", sitemapRoutes);
app.use("/", robotsRoutes);
app.use("/", llmsRoutes);
app.use("/", indexNowRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: true,
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(errorMiddleware);

const server = http.createServer(app);
const socketService = require("./services/socketService");
socketService.initSocket(server);

server.listen(PORT, () => {
  console.log(
    `CouponDealz API http://localhost:${PORT}/api/v1 (CORS: ${corsOrigins.join(", ")})`
  );
});

function shutdown(signal) {
  console.log(`${signal}: closing server`);
  server.close((err) => {
    if (err) console.error(err);
    mongoose.connection
      .close()
      .then(() => process.exit(err ? 1 : 0))
      .catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
