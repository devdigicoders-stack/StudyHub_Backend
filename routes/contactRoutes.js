const express = require("express");
const router = express.Router();

// TEST
router.get("/", (req, res) => {
  res.send("Contact route working ✅");
});

// POST CONTACT
router.post("/", (req, res) => {
  const { name, email, message } = req.body;

  res.json({
    success: true,
    message: "Contact form submitted ✅",
    data: { name, email, message },
  });
});

module.exports = router;