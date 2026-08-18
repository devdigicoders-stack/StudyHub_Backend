const { db } = require("../config/firebase");

const allowedSemesters = ["1", "2", "3", "4", "5", "6"];
const allowedCategories = ["book", "notes", "question_bank", "previous_paper"];

// ✅ UPLOAD
const uploadStudyMaterial = async (req, res) => {
  try {
    const { title, semester, subject, category, fileUrl } = req.body;

    if (!allowedSemesters.includes(semester)) {
      return res.status(400).json({ message: "Semester must be 1–6" });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (!fileUrl) {
      return res.status(400).json({ message: "Google Drive Link is required" });
    }

    const docRef = await db.collection("study").add({
      title,
      semester,
      subject,
      category,
      fileUrl: fileUrl,
      status: "pending", // 🔥 important
      createdAt: new Date(),
    });

    res.json({ message: "Uploaded (Pending) ⏳", id: docRef.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ USER GET (only approved)
const getStudyMaterial = async (req, res) => {
  try {
    const snapshot = await db
      .collection("study")
      .where("status", "==", "approved")
      .get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ ADMIN GET (all)
const getAllStudyMaterial = async (req, res) => {
  try {
    const snapshot = await db.collection("study").get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ APPROVE
const approveStudyMaterial = async (req, res) => {
  await db.collection("study").doc(req.params.id).update({
    status: "approved",
  });

  res.json({ message: "Approved ✅" });
};

// ❌ REJECT
const rejectStudyMaterial = async (req, res) => {
  await db.collection("study").doc(req.params.id).update({
    status: "rejected",
  });

  res.json({ message: "Rejected ❌" });
};

// 🗑 DELETE
const deleteStudyMaterial = async (req, res) => {
  const doc = await db.collection("study").doc(req.params.id).get();

  if (!doc.exists) return res.status(404).json({ message: "Not found" });

  const data = doc.data();

  await db.collection("study").doc(req.params.id).delete();

  res.json({ message: "Deleted ✅" });
};

module.exports = {
  uploadStudyMaterial,
  getStudyMaterial,
  getAllStudyMaterial,
  approveStudyMaterial,
  rejectStudyMaterial,
  deleteStudyMaterial,
};
