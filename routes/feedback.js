const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// POST a new feedback
router.post("/", async (req, res) => {
  try {
    const { name, category, rating, comment } = req.body;

    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: "Rating is required" });
    }

    const newFeedback = await Feedback.create({
      name: name ? name.trim() : "Anonymous Scholar",
      category: category || "Overall Experience",
      rating: Number(rating),
      comment: comment ? comment.trim() : "",
    });

    return res.status(201).json({
      success: true,
      id: newFeedback._id,
      ...newFeedback.toJSON(),
    });
  } catch (err) {
    console.error("Feedback MongoDB Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET all feedbacks
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a specific feedback
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Feedback.findByIdAndDelete(id);

    if (!doc) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json({ success: true, message: "Feedback deleted from MongoDB" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
