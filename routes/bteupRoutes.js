const express = require("express");
const router = express.Router();

// BTEUP Route (Frontend handles direct result generation)
router.get("/status", (req, res) => {
  res.json({ message: "BTEUP route active" });
});

module.exports = router;
