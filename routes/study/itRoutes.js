const express = require("express");
const router = express.Router();
const it = require("../../controllers/study/itController");

router.post("/upload", it.upload);
router.get("/", it.getApproved);
router.get("/admin", it.getAll);
router.put("/approve/:id", it.approve);
router.put("/reject/:id", it.reject);
router.delete("/:id", it.remove);

module.exports = router;
