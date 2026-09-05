const cloudinary = require("../config/cloudinary");
const SingleBanner = require("../models/SingleBanner");

// 🔥 UPLOAD / UPDATE SINGLE BANNER
exports.uploadBanner = async (req, res) => {
  try {
    const { page } = req.body;

    if (!page) {
      return res.status(400).json({ message: "Page is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `single_banners/${page}`,
    });

    // Delete old banners for the same page
    const oldBanners = await SingleBanner.find({ page });
    for (const oldDoc of oldBanners) {
      if (oldDoc.public_id) {
        try {
          await cloudinary.uploader.destroy(oldDoc.public_id);
        } catch (e) {
          console.warn("Could not delete old image from Cloudinary:", e);
        }
      }
      await SingleBanner.findByIdAndDelete(oldDoc._id);
    }

    // Save new banner in MongoDB
    const banner = await SingleBanner.create({
      page,
      url: result.secure_url,
      public_id: result.public_id,
    });

    res.json({
      success: true,
      message: `${page} banner uploaded successfully to MongoDB`,
      data: {
        id: banner._id,
        url: banner.url,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET SINGLE BANNER
exports.getBanner = async (req, res) => {
  try {
    const { page } = req.params;

    const banner = await SingleBanner.findOne({ page });

    if (!banner) {
      return res.json(null);
    }

    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 DELETE SINGLE BANNER
exports.deleteBanner = async (req, res) => {
  try {
    const { page } = req.params;

    const banners = await SingleBanner.find({ page });

    if (!banners || banners.length === 0) {
      return res.status(404).json({ message: "Banner not found" });
    }

    for (const doc of banners) {
      if (doc.public_id) {
        await cloudinary.uploader.destroy(doc.public_id);
      }
      await SingleBanner.findByIdAndDelete(doc._id);
    }

    res.json({
      success: true,
      message: "Banner deleted successfully from MongoDB",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
