const express = require("express");
const router = express.Router();
const ProjectRequest = require("../models/ProjectRequest");

// POST a new request
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, projectType, message } = req.body;

    if (!name || !email || !projectType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const newRequest = await ProjectRequest.create({
      name,
      email,
      phone: phone || "",
      projectType,
      message: message || "",
    });

    res.status(200).json({
      success: true,
      message: "Request sent successfully",
      id: newRequest._id,
      ...newRequest.toJSON(),
    });
  } catch (error) {
    console.error("Error creating project request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET all requests
router.get("/", async (req, res) => {
  try {
    const requests = await ProjectRequest.find().sort({ createdAt: -1 });
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
    await ProjectRequest.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
