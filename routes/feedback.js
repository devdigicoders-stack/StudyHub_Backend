const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// POST a new feedback
router.post("/", async (req, res) => {
  try {
    const { name, category, rating, comment } = req.body;

    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: "Rating is required" });
    }

    const feedbackData = {
      name: name ? name.trim() : "Anonymous Scholar",
      category: category || "Overall Experience",
      rating: rating,
      comment: comment ? comment.trim() : "",
      createdAt: new Date(),
    };

    const docRef = await db.collection("feedbacks").add(feedbackData);
    return res
      .status(201)
      .json({ success: true, id: docRef.id, ...feedbackData });
  } catch (err) {
    console.error("Firestore Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET all feedbacks
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("feedbacks").get();
    let feedbacks = [];
    snapshot.forEach((doc) => feedbacks.push({ id: doc.id, ...doc.data() }));

    // Sort Newest First
    feedbacks.sort((a, b) => {
      const dateA = a.createdAt
        ? a.createdAt.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt)
        : new Date(0);
      const dateB = b.createdAt
        ? b.createdAt.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt)
        : new Date(0);
      return dateB - dateA;
    });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a specific feedback
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("feedbacks").doc(id);

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    await docRef.delete();
    res.json({ success: true, message: "Feedback deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
