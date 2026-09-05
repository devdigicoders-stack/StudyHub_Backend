const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  try {
    const { type, title, desc, link, author, tag } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "Category Type and Title are required" });
    }

    const newPost = await Post.create({
      type: type.trim().toLowerCase(),
      title: title.trim(),
      desc: desc ? desc.trim() : "",
      link: link ? link.trim() : "",
      author: author ? author.trim() : "",
      tag: tag ? tag.trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "Post published successfully",
      post: newPost,
      id: newPost._id,
      ...newPost.toJSON(),
    });
  } catch (error) {
    console.error("Error creating post in MongoDB:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type: type.toLowerCase() } : {};
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts from MongoDB:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Post.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ success: true, message: "Post deleted successfully from MongoDB" });
  } catch (error) {
    console.error("Error deleting post from MongoDB:", error);
    res.status(500).json({ error: error.message });
  }
};

