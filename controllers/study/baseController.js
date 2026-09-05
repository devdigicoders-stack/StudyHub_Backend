const StudyMaterial = require("../../models/StudyMaterial");

const createController = (branchName) => {
  return {
    upload: async (req, res) => {
      try {
        const { title, semester, subject, category, fileUrl } = req.body;

        if (!fileUrl) {
          return res
            .status(400)
            .json({ message: "Google Drive Link is required ❌" });
        }

        const newDoc = await StudyMaterial.create({
          branch: branchName.toLowerCase(),
          title,
          semester: semester ? String(semester) : "1",
          subject,
          category: category || "notes",
          fileUrl: fileUrl,
          status: "pending",
        });

        res.json({ message: "Uploaded to MongoDB ✅", id: newDoc._id });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },

    getApproved: async (req, res) => {
      try {
        const data = await StudyMaterial.find({
          branch: branchName.toLowerCase(),
          status: "approved",
        }).sort({ createdAt: -1 });

        res.json({ data });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    getAll: async (req, res) => {
      try {
        const data = await StudyMaterial.find({
          branch: branchName.toLowerCase(),
        }).sort({ createdAt: -1 });

        res.json({ data });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    approve: async (req, res) => {
      try {
        await StudyMaterial.findByIdAndUpdate(req.params.id, {
          status: "approved",
        });

        res.json({ message: "Approved ✅" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    reject: async (req, res) => {
      try {
        await StudyMaterial.findByIdAndUpdate(req.params.id, {
          status: "rejected",
        });

        res.json({ message: "Rejected ❌" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    remove: async (req, res) => {
      try {
        const doc = await StudyMaterial.findByIdAndDelete(req.params.id);

        if (!doc) return res.status(404).json({ message: "Not found" });

        res.json({ message: "Deleted ✅" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
};

module.exports = createController;
