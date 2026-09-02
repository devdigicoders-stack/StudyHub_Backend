const express = require("express");
const router = express.Router();
const Syllabus = require("../models/Syllabus");

// Default Fallback / Initial Seed Data if DB is empty
const defaultSyllabus = [
  {
    code: "322",
    name: "Diploma in Civil Engineering",
    link: "https://drive.google.com/file/d/1X-example-civil/view?usp=sharing",
    session: "2025-26",
    sno: 1,
  },
  {
    code: "328",
    name: "Diploma in Electrical Engineering",
    link: "https://drive.google.com/file/d/1X-example-electrical/view?usp=sharing",
    session: "2025-26",
    sno: 2,
  },
  {
    code: "330",
    name: "Diploma in Electronics Engineering",
    link: "https://drive.google.com/file/d/1X-example-electronics/view?usp=sharing",
    session: "2025-26",
    sno: 3,
  },
  {
    code: "343",
    name: "Diploma in Mechanical Engineering (Production)",
    link: "https://drive.google.com/file/d/1X-example-mech/view?usp=sharing",
    session: "2025-26",
    sno: 4,
  },
  {
    code: "355",
    name: "Diploma in Computer Science & Engineering",
    link: "https://drive.google.com/file/d/1X-example-cse/view?usp=sharing",
    session: "2025-26",
    sno: 5,
  },
  {
    code: "356",
    name: "Diploma in Information Technology",
    link: "https://drive.google.com/file/d/1X-example-it/view?usp=sharing",
    session: "2025-26",
    sno: 6,
  },
];

// GET: Fetch all syllabus entries
router.get("/", async (req, res) => {
  try {
    const list = await Syllabus.find().sort({ code: 1, createdAt: 1 });
    return res.json(list);
  } catch (error) {
    console.error("Error fetching syllabus:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST: Add new syllabus entry
router.post("/", async (req, res) => {
  try {
    const { code, name, link, session, sno } = req.body;

    if (!code || !name || !link) {
      return res.status(400).json({
        error: "Branch Code, Branch Name aur Google Drive Link zaroori hai!",
      });
    }

    const newSyllabus = await Syllabus.create({
      code: code.trim(),
      name: name.trim(),
      link: link.trim(),
      session: (session || "2025-26").trim(),
      sno: sno ? Number(sno) : 1,
    });

    return res.status(201).json({
      success: true,
      message: "Syllabus entry successfully added! 🎉",
      data: newSyllabus,
    });
  } catch (error) {
    console.error("Error creating syllabus:", error);
    return res.status(500).json({ error: error.message });
  }
});

// PUT: Update syllabus entry
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, link, session, sno } = req.body;

    const updateData = {};
    if (code) updateData.code = code.trim();
    if (name) updateData.name = name.trim();
    if (link) updateData.link = link.trim();
    if (session) updateData.session = session.trim();
    if (sno !== undefined) updateData.sno = Number(sno);

    const updated = await Syllabus.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Syllabus entry nahi mili" });
    }

    return res.json({
      success: true,
      message: "Syllabus successfully updated! ✏️",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating syllabus:", error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE: Remove syllabus entry
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Syllabus.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Syllabus entry nahi mili" });
    }

    return res.json({
      success: true,
      message: "Syllabus entry deleted successfully! 🗑️",
    });
  } catch (error) {
    console.error("Error deleting syllabus:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
