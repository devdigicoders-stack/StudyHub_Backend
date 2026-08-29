const express = require("express");
const router = express.Router();
const ContactMessage = require("../models/ContactMessage");
const multer = require("multer");
const fs = require("fs");
const cardController = require("./cardController");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sirf Images (JPG, PNG, WEBP) allowed hain!"), false);
    }
  },
});

// POST: Submit a new contact message
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const doc = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      id: doc._id,
      ...doc.toJSON(),
    });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while saving message" });
  }
});

// GET: Fetch all contact messages
router.get("/", async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
    });
  }
});

// DELETE: Delete a specific contact message
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ContactMessage.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting message" });
  }
});

// --- FEATURED PROJECTS ROUTES ---

// POST: Upload a new project
router.post(
  "/projects",
  upload.single("image"),
  cardController.createUploadHandler({
    collectionName: "featuredProjects",
    folderName: "featured_projects",
    requiredFields: ["projectName", "description", "languageName"],
    successMessage: "Project added successfully!",
  }),
);

// GET: Fetch all featured projects
router.get(
  "/projects",
  cardController.createGetHandler({
    collectionName: "featuredProjects",
    sortOrder: "desc",
  }),
);

// DELETE: Delete a featured project
router.delete(
  "/projects/:id",
  cardController.createDeleteHandler({
    collectionName: "featuredProjects",
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
