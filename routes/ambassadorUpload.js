const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const cardController = require("../controllers/cardController");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sirf Images (JPG, PNG, WEBP) allowed hain!"), false);
    }
  },
});

router.post(
  "/",
  upload.single("image"),
  cardController.createUploadHandler({
    collectionName: "ambassadors",
    folderName: "ambassadors",
    requiredFields: ["name", "branch", "college"],
    successMessage: "Ambassador profile published successfully!",
  }),
);

router.delete(
  "/:id",
  cardController.createDeleteHandler({
    collectionName: "ambassadors",
  }),
);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

module.exports = router;
