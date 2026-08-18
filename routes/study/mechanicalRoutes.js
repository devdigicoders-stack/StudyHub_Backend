const express = require("express");
const router = express.Router();
const mechanical = require("../../controllers/study/mechanicalController");

router.post("/upload", mechanical.upload);
router.get("/", mechanical.getApproved);
router.get("/admin", mechanical.getAll);
router.put("/approve/:id", mechanical.approve);
router.put("/reject/:id", mechanical.reject);
router.delete("/:id", mechanical.remove);

module.exports = router;
