const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const {db} = require("../config/firebase");

// Generic Upload Controller Handler
exports.createUploadHandler = ({
  collectionName,
  folderName,
  requiredFields,
  successMessage,
}) => {
  return async (req, res) => {
    let filePath = req.file?.path;

    try {
      // 1. Check if file exists
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "Image file is required / upload karna zaroori hai" });
      }

      // 2. Check required fields
      for (const field of requiredFields) {
        if (!req.body[field]) {
          if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return res
            .status(400)
            .json({
              error: `Sabhi required fields (${requiredFields.join(", ")}) bharna zaroori hai`,
            });
        }
      }

      // 3. Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folderName,
        resource_type: "image",
      });

      // 4. Delete local file (Success ke baad)
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 5. Build data object and Save to Firestore
      const dataToSave = { ...req.body };
      for (const key in dataToSave) {
        if (typeof dataToSave[key] === "string") {
          dataToSave[key] = dataToSave[key].trim();
        }
      }

      dataToSave.imageUrl = result.secure_url;
      dataToSave.cloudinaryId = result.public_id;
      dataToSave.createdAt = new Date();

      const docRef = await db.collection(collectionName).add(dataToSave);

      return res.status(201).json({
        success: true,
        message: successMessage || "Published successfully!",
        id: docRef.id,
        jobId: docRef.id, // for backwards compatibility with jobUpload
        ...dataToSave,
      });
    } catch (err) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.error("Cloudinary/Firestore Error:", err);
      return res
        .status(500)
        .json({ error: err.message || "Internal Server Error" });
    }
  };
};

// Generic Get Controller Handler
exports.createGetHandler = ({ collectionName, sortOrder = "asc" }) => {
  return async (req, res) => {
    try {
      const snapshot = await db.collection(collectionName).get();
      let items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // Sort in memory by createdAt
      items.sort((a, b) => {
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
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });

      res.json(items);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      res.status(500).json({ error: error.message });
    }
  };
};

// Generic Delete Controller Handler
exports.createDeleteHandler = ({ collectionName }) => {
  return async (req, res) => {
    try {
      const { id } = req.params;

      const docRef = db.collection(collectionName).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Card / Data not found" });
      }

      const data = doc.data();

      const cloudinaryId = data.cloudinaryId || data.publicId;
      if (cloudinaryId) {
        await cloudinary.uploader
          .destroy(cloudinaryId)
          .catch((err) => console.error("Cloudinary Delete Error:", err));
      }

      await docRef.delete();

      res.json({ success: true, message: "Deleted successfully!" });
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      res.status(500).json({ error: error.message });
    }
  };
};
