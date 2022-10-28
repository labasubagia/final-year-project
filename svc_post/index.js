const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
app.use(express.json({ limit: "500mb" }));
app.use(cors());

const Post = new mongoose.model("Post", {
  title: String,
  body: String,
});

app.get("/posts", async (req, res) => {
  try {
    const limit = req.query.limit ?? 10;
    const posts = await Post.aggregate([
      { $limit: Number(limit) },
      { $addFields: { _id: "$$REMOVE", __v: "$$REMOVE", post_id: "$_id" } },
    ]).allowDiskUse(true);
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { title, body } = req.body;
    const post = new Post({ title, body });
    await post.save();
    res.send(post);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Listening at port ${process.env.PORT}`);
  });
});
