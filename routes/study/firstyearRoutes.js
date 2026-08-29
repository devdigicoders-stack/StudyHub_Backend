const express = require("express");
const router = express.Router();

const firstyear = require("../../controllers/study/firstyearController");

// ROUTES
router.post("/upload", firstyear.upload);
router.get("/", firstyear.getApproved);
router.get("/admin", firstyear.getAll);
router.put("/approve/:id", firstyear.approve);
router.put("/reject/:id", firstyear.reject);
router.delete("/:id", firstyear.remove);

module.exports = router; // ✅ MUST
