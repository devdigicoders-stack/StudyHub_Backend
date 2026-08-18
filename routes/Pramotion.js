const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const cardController = require("../controllers/cardController");
const { db } = require("../config/firebase");

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

// ===============================
// PROMOTION UPLOADS (Admin)
// ===============================
router.post(
  "/upload",
  upload.single("image"),
  cardController.createUploadHandler({
    collectionName: "promotions",
    folderName: "promotions_folder",
    requiredFields: ["companyName", "branch"],
    successMessage: "Promotion successfully uploaded!",
  }),
);

router.get(
  "/upload",
  cardController.createGetHandler({
    collectionName: "promotions",
    sortOrder: "desc",
  }),
);

router.delete(
  "/upload/:id",
  cardController.createDeleteHandler({ collectionName: "promotions" }),
);

// ===============================
// PROMOTION REQUESTS (Contact form from SummerTraining)
// ===============================
router.post("/request", async (req, res) => {
  try {
    const { name, companyName, mobileNumber } = req.body;

    if (!name || !companyName || !mobileNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const docRef = await db.collection("promotionRequests").add({
      name,
      companyName,
      mobileNumber,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: "Request sent successfully",
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error creating promotion request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/request", async (req, res) => {
  try {
    const snapshot = await db.collection("promotionRequests").get();
    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    // Sort descending by createdAt
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/request/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("promotionRequests").doc(id).delete();
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

module.exports = router;
