const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const cardController = require("../controllers/cardController");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  upload.single("image"),
  cardController.createUploadHandler({
    collectionName: "jobs",
    folderName: "jobs",
    requiredFields: ["title", "link"],
    successMessage: "Job uploaded",
  }),
);

module.exports = router;
