const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  uploadBanner,
  getBanners,
  getSingleBanner,
  deleteBanner,
} = require("../controllers/bannerController");

// multer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"), false);
  },
});

// 🔥 ROUTES
router.post("/upload", upload.single("image"), uploadBanner);
router.get("/", getBanners); // For query parameters e.g., ?category=cse
router.get("/:page", getSingleBanner);
router.delete("/:id", deleteBanner);

module.exports = router;
