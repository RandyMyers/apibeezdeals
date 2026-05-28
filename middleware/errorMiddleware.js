/** Central error handler — JSON body aligned with integration plan. */
function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Request failed";

  if (status >= 500) {
    console.error("[api]", err);
  }

  res.status(status).json({
    error: true,
    code: err.code || "ERROR",
    message,
    ...(process.env.NODE_ENV !== "production" && err.stack
      ? { stack: err.stack.split("\n").slice(0, 8).join("\n") }
      : {}),
  });
}

module.exports = errorMiddleware;
