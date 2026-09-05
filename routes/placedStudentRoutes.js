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
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/avif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sirf Images (JPG, PNG, WEBP, AVIF) upload kar sakte hain!"), false);
    }
  },
});

// GET all placed students
router.get(
  "/",
  cardController.createGetHandler({
    collectionName: "placed_students",
    sortOrder: "desc",
  })
);

// POST upload new placed student
router.post(
  "/",
  upload.single("image"),
  cardController.createUploadHandler({
    collectionName: "placed_students",
    folderName: "placed_students",
    requiredFields: ["name", "collegeName", "companyName", "role"],
    successMessage: "Placed Student profile published successfully!",
  })
);

// DELETE placed student by ID
router.delete(
  "/:id",
  cardController.createDeleteHandler({
    collectionName: "placed_students",
  })
);

// Multer error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

module.exports = router;
