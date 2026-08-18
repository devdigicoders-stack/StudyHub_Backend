const { db } = require("../../config/firebase");

const createController = (collectionName) => {
  return {
    upload: async (req, res) => {
      try {
        const { title, semester, subject, category, fileUrl } = req.body;

        if (!fileUrl) {
          return res
            .status(400)
            .json({ message: "Google Drive Link is required ❌" });
        }

        const docRef = await db.collection(collectionName).add({
          title,
          semester,
          subject,
          category,
          fileUrl: fileUrl,
          status: "pending",
          createdAt: new Date(),
        });

        res.json({ message: "Uploaded ✅", id: docRef.id });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },

    getApproved: async (req, res) => {
      const snapshot = await db
        .collection(collectionName)
        .where("status", "==", "approved")
        .get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ data });
    },

    getAll: async (req, res) => {
      const snapshot = await db.collection(collectionName).get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ data });
    },

    approve: async (req, res) => {
      await db.collection(collectionName).doc(req.params.id).update({
        status: "approved",
      });

      res.json({ message: "Approved ✅" });
    },

    reject: async (req, res) => {
      await db.collection(collectionName).doc(req.params.id).update({
        status: "rejected",
      });

      res.json({ message: "Rejected ❌" });
    },

    remove: async (req, res) => {
      const doc = await db.collection(collectionName).doc(req.params.id).get();

      if (!doc.exists) return res.status(404).json({ message: "Not found" });

      const data = doc.data();

      await db.collection(collectionName).doc(req.params.id).delete();

      res.json({ message: "Deleted ✅" });
    },
  };
};

// ✅ MOST IMPORTANT LINE
module.exports = createController;
