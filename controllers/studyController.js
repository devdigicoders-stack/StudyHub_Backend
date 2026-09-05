const StudyMaterial = require("../models/StudyMaterial");

const allowedSemesters = ["1", "2", "3", "4", "5", "6"];
const allowedCategories = [
  "book",
  "notes",
  "question_bank",
  "previous_paper",
  "important_question",
];

// ✅ UPLOAD
const uploadStudyMaterial = async (req, res) => {
  try {
    const { title, semester, subject, category, fileUrl } = req.body;

    if (!allowedSemesters.includes(String(semester))) {
      return res.status(400).json({ message: "Semester must be 1–6" });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (!fileUrl) {
      return res
        .status(400)
        .json({ message: "Google Drive Link is required" });
    }

    const newDoc = await StudyMaterial.create({
      branch: "general",
      title,
      semester: String(semester),
      subject,
      category,
      fileUrl: fileUrl,
      status: "pending",
    });

    res.json({ message: "Uploaded (Pending) ⏳", id: newDoc._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ USER GET (only approved)
const getStudyMaterial = async (req, res) => {
  try {
    const data = await StudyMaterial.find({ status: "approved" }).sort({
      createdAt: -1,
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ ADMIN GET (all)
const getAllStudyMaterial = async (req, res) => {
  try {
    const data = await StudyMaterial.find().sort({ createdAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ APPROVE
const approveStudyMaterial = async (req, res) => {
  try {
    await StudyMaterial.findByIdAndUpdate(req.params.id, {
      status: "approved",
    });
    res.json({ message: "Approved ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ REJECT
const rejectStudyMaterial = async (req, res) => {
  try {
    await StudyMaterial.findByIdAndUpdate(req.params.id, {
      status: "rejected",
    });
    res.json({ message: "Rejected ❌" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🗑 DELETE
const deleteStudyMaterial = async (req, res) => {
  try {
    const doc = await StudyMaterial.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadStudyMaterial,
  getStudyMaterial,
  getAllStudyMaterial,
  approveStudyMaterial,
  rejectStudyMaterial,
  deleteStudyMaterial,
};
