const express = require("express");
const router = express.Router();
const db = require("../config/firebase");

// POST a new request
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, projectType, message } = req.body;
    
    if (!name || !email || !projectType) {
       return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const docRef = await db.collection("projectRequests").add({
      name,
      email,
      phone: phone || "",
      projectType,
      message: message || "",
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: "Request sent successfully", id: docRef.id });
  } catch (error) {
    console.error("Error creating project request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET all requests
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("projectRequests").get();
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort descending by createdAt
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE a request
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("projectRequests").doc(id).delete();
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
