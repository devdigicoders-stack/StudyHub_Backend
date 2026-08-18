const express = require("express");
const router = express.Router();
const electrical = require("../../controllers/study/electricalController");

router.post("/upload", electrical.upload);
router.get("/", electrical.getApproved);
router.get("/admin", electrical.getAll);
router.put("/approve/:id", electrical.approve);
router.put("/reject/:id", electrical.reject);
router.delete("/:id", electrical.remove);

module.exports = router;
