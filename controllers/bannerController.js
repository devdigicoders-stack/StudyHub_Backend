const cloudinary = require("../config/cloudinary");
const Banner = require("../models/Banner");

// 🔥 UPLOAD BANNER
exports.uploadBanner = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");

    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${base64}`,
      {
        folder: `banners/${category}`,
      },
    );

    // Save to MongoDB
    const banner = await Banner.create({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      category,
    });

    return res.json({
      success: true,
      data: {
        id: banner._id,
        url: banner.url,
        category: banner.category,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET BANNERS
exports.getBanners = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category) {
      filter.category = category;
    }

    const banners = await Banner.find(filter).sort({ createdAt: -1 });

    return res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET SINGLE BANNER
exports.getSingleBanner = async (req, res) => {
  try {
    const { page } = req.params;

    const banner = await Banner.findOne({ page });

    return res.json(banner || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 DELETE BANNER
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Not found" });
    }

    if (banner.public_id) {
      await cloudinary.uploader.destroy(banner.public_id);
    }

    await Banner.findByIdAndDelete(id);

    return res.json({ success: true, message: "Banner deleted from MongoDB ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
