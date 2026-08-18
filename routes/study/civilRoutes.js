const express = require("express");
const router = express.Router();
const civil = require("../../controllers/study/civilController");

router.post("/upload", civil.upload);
router.get("/", civil.getApproved);
router.get("/admin", civil.getAll);
router.put("/approve/:id", civil.approve);
router.put("/reject/:id", civil.reject);
router.delete("/:id", civil.remove);

module.exports = router;
