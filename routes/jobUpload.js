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

// Post Route using controller
router.post(
  "/",
  upload.single("image"),
  cardController.createUploadHandler({
    collectionName: "jobs",
    folderName: "polytechnic_jobs",
    requiredFields: ["title", "place", "link"],
    successMessage: "Job published successfully!",
  }),
);

// Get Route
router.get(
  "/",
  cardController.createGetHandler({
    collectionName: "jobs",
    sortOrder: "desc",
  }),
);

// Update / Edit Route
router.put(
  "/:id",
  upload.single("image"),
  cardController.createUpdateHandler({
    collectionName: "jobs",
    folderName: "polytechnic_jobs",
    successMessage: "Job updated successfully!",
  }),
);

// Delete Route using controller
router.delete(
  "/:id",
  cardController.createDeleteHandler({
    collectionName: "jobs",
  }),
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

