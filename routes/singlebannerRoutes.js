const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  uploadBanner,
  getBanner,
  deleteBanner,
} = require("../controllers/singlebannerController");

// 🔥 Multer config (memory storage for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (important)
  },
});

// 🔥 UPLOAD / UPDATE BANNER
router.post("/upload", upload.single("image"), uploadBanner);

// 🔥 GET BANNER BY PAGE (home/about/contact)
router.get("/:page", getBanner);

// 🔥 DELETE BANNER BY PAGE
router.delete("/:page", deleteBanner);

module.exports = router;
