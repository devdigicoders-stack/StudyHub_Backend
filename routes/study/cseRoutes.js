const express = require("express");
const router = express.Router();

const cse = require("../../controllers/study/cseController");
// ROUTES
router.post("/upload", cse.upload);
router.get("/", cse.getApproved);
router.get("/admin", cse.getAll);
router.put("/approve/:id", cse.approve);
router.put("/reject/:id", cse.reject);
router.delete("/:id", cse.remove);

module.exports = router; // ✅ MUST
