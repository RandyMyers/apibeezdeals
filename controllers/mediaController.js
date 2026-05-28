const os = require("os");
const cloudinary = require("cloudinary").v2;
const cloudinaryConfig = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");

cloudinary.config(cloudinaryConfig);

function cloudinaryReady() {
  return !!(
    cloudinaryConfig.cloud_name &&
    cloudinaryConfig.api_key &&
    cloudinaryConfig.api_secret
  );
}

/** POST /admin/upload — multipart field `file`, optional body `folder` (default blog). */
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!cloudinaryReady()) {
    return res.status(503).json({
      error: true,
      code: "CLOUDINARY_NOT_CONFIGURED",
      message:
        "Image upload is not configured. Set CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET in server/.env",
    });
  }

  const file = req.files?.file || req.files?.image;
  if (!file) {
    return res.status(400).json({
      error: true,
      code: "NO_FILE",
      message: "No file uploaded. Use multipart field name `file`.",
    });
  }

  const folder = String(req.body?.folder || "blog")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 40) || "blog";

  const uploadPath = file.tempFilePath || file.path;
  if (!uploadPath) {
    return res.status(400).json({
      error: true,
      code: "INVALID_FILE",
      message: "Could not read uploaded file.",
    });
  }

  const result = await cloudinary.uploader.upload(uploadPath, {
    folder: `coupondealz/${folder}`,
    resource_type: "image",
    overwrite: false,
  });

  res.json({
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  });
});

exports.getUploadStatus = asyncHandler(async (req, res) => {
  res.json({
    cloudinary: cloudinaryReady(),
    tempDir: os.tmpdir(),
  });
});
