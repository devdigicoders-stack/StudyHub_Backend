const express = require("express");
const router = express.Router();
const electronics = require("../../controllers/study/electricalController");

router.post("/upload", electronics.upload);
router.get("/", electronics.getApproved);
router.get("/admin", electronics.getAll);
router.put("/approve/:id", electronics.approve);
router.put("/reject/:id", electronics.reject);
router.delete("/:id", electronics.remove);

module.exports = router;
