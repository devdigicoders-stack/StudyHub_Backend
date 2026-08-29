const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const CardItem = require("../models/CardItem");

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

      // 4. Delete local file (after successful upload)
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 5. Build data object and save to MongoDB
      const dataToSave = { ...req.body };
      for (const key in dataToSave) {
        if (typeof dataToSave[key] === "string") {
          dataToSave[key] = dataToSave[key].trim();
        }
      }

      dataToSave.collectionName = collectionName;
      dataToSave.imageUrl = result.secure_url;
      dataToSave.cloudinaryId = result.public_id;

      const newCard = await CardItem.create(dataToSave);

      return res.status(201).json({
        success: true,
        message: successMessage || "Published successfully in MongoDB!",
        id: newCard._id,
        jobId: newCard._id,
        ...newCard.toJSON(),
      });
    } catch (err) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.error("Cloudinary/MongoDB Error:", err);
      return res
        .status(500)
        .json({ error: err.message || "Internal Server Error" });
    }
  };
};

// Generic Get Controller Handler
exports.createGetHandler = ({ collectionName, sortOrder = "desc" }) => {
  return async (req, res) => {
    try {
      const sortDirection = sortOrder === "asc" ? 1 : -1;
      const items = await CardItem.find({ collectionName }).sort({
        createdAt: sortDirection,
      });

      res.json(items);
    } catch (error) {
      console.error(`Error fetching ${collectionName} from MongoDB:`, error);
      res.status(500).json({ error: error.message });
    }
  };
};

// Generic Delete Controller Handler
exports.createDeleteHandler = ({ collectionName }) => {
  return async (req, res) => {
    try {
      const { id } = req.params;

      const doc = await CardItem.findOne({
        _id: id,
        collectionName,
      });

      if (!doc) {
        return res.status(404).json({ error: "Card / Data not found" });
      }

      const cloudinaryId = doc.cloudinaryId || doc.publicId;
      if (cloudinaryId) {
        await cloudinary.uploader
          .destroy(cloudinaryId)
          .catch((err) => console.error("Cloudinary Delete Error:", err));
      }

      await CardItem.findByIdAndDelete(id);

      res.json({ success: true, message: "Deleted successfully from MongoDB!" });
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      res.status(500).json({ error: error.message });
    }
  };
};
