const express = require("express");
const router = express.Router();

// ✅ CONTROLLER IMPORT (IMPORTANT)
const {
  uploadStudyMaterial,
  getStudyMaterial,
  getAllStudyMaterial,
  approveStudyMaterial,
  rejectStudyMaterial,
  deleteStudyMaterial,
} = require("../controllers/studyController");

// ================= ROUTES =================

// 🔥 UPLOAD
router.post("/upload", uploadStudyMaterial);

// 👨‍🎓 USER (only approved)
router.get("/", getStudyMaterial);

// 👨‍💼 ADMIN (all data)
router.get("/admin", getAllStudyMaterial);

// ✅ APPROVE
router.put("/approve/:id", approveStudyMaterial);

// ❌ REJECT
router.put("/reject/:id", rejectStudyMaterial);

// 🗑 DELETE
router.delete("/:id", deleteStudyMaterial);

module.exports = router;
