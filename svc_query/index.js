const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
app.use(express.json({ limit: "500mb" }));
app.use(cors());

const PUBSUB_TOPIC_POST_CREATED = "PostCreated";
const PUBSUB_TOPIC_COMMENT_CREATED = "CommentCreated";
const FETCH_POST_DEFAULT_LIMIT = 10;

const commentSchema = new mongoose.Schema(
  {
    comment_id: { type: mongoose.ObjectId, index: true },
    post_id: { type: mongoose.ObjectId, index: true },
    text: String,
  },
  { _id: false }
);
const Comment = new mongoose.model("Comment", commentSchema);

const postSchema = new mongoose.Schema(
  {
    post_id: { type: mongoose.ObjectId, index: true },
    title: String,
    body: String,
  },
  { _id: false }
);
const Post = new mongoose.model("Post", postSchema);

const postQuerySchema = new mongoose.Schema(
  {
    title: String,
    body: String,
    post_id: { type: mongoose.ObjectId, index: { unique: true } },
    comments: {
      type: [
        new mongoose.Schema(
          {
            comment_id: { type: mongoose.ObjectId, index: true },
            text: String,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);
const PostQuery = new mongoose.model("Post_Query", postQuerySchema);

const postCreatedHandler = async ({ _id, title, body }) => {
  try {
    console.log({ post_id: _id, title, body });

    // Materialize Query / Table View
    await PostQuery.findOneAndUpdate(
      { post_id: _id },
      { title, body, post_id: _id },
      { upsert: true }
    );

    // Normal Collection
    await Post.findOneAndUpdate(
      { post_id: _id },
      { title, body, post_id: _id },
      { upsert: true }
    );
  } catch (err) {
    console.log({
      error: err.message,
      payload: { post_id: _id, title, body },
    });
  }
};

const commentCreatedHandler = async ({ _id, post_id, text }) => {
  try {
    // Materialize Query / Table View
    await PostQuery.findOneAndUpdate(
      { post_id },
      { $push: { comments: { comment_id: _id, text } } },
      { upsert: true }
    );

    // Normal Collection
    await Comment.findOneAndUpdate(
      { comment_id: _id },
      { text, comment_id: _id, post_id },
      { upsert: true }
    );
  } catch (err) {
    console.log({
      error: err.message,
      payload: { comment_id: _id, post_id, text },
    });
  }
};

// CQRS: Materialize
app.get("/posts-materialize", async (req, res) => {
  try {
    const limit = req.query.limit ?? FETCH_POST_DEFAULT_LIMIT;
    const posts = await PostQuery.aggregate([
      { $limit: Number(limit) },
      { $addFields: { _id: "$$REMOVE", __v: "$$REMOVE" } },
    ]).allowDiskUse(true);
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// CQRS: Single Aggregate Query Relation
app.get("/posts-query-agg", async (req, res) => {
  try {
    const limit = req.query.limit ?? FETCH_POST_DEFAULT_LIMIT;
    const posts = await Post.aggregate([
      { $limit: Number(limit) },
      {
        $lookup: {
          from: Comment.collection.name,
          localField: "post_id",
          foreignField: "post_id",
          as: "comments",
        },
      },
      {
        $addFields: {
          _id: "$$REMOVE",
          __v: "$$REMOVE",
          "comments.__v": "$$REMOVE",
          "comments._id": "$$REMOVE",
          "comments.post_id": "$$REMOVE",
        },
      },
    ]).allowDiskUse(true);
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// CQRS: Manual Relation
app.get("/posts-query-manual", async (req, res) => {
  try {
    const limit = req.query.limit ?? FETCH_POST_DEFAULT_LIMIT;
    let posts = await Post.aggregate([
      { $limit: Number(limit) },
      { $addFields: { _id: "$$REMOVE", __v: "$$REMOVE" } },
    ]).allowDiskUse(true);

    const postIds = posts.map((p) => p.post_id);
    let comments = await Comment.aggregate([
      { $match: { post_id: { $in: postIds } } },
      { $addFields: { _id: "$$REMOVE", __v: "$$REMOVE" } },
    ]).allowDiskUse(true);

    posts = JSON.parse(JSON.stringify(posts));
    comments = JSON.parse(JSON.stringify(comments));

    posts = posts.map((post) => {
      post.comments = [];
      comments = comments.filter((comment) => {
        if (post.post_id != comment.post_id) return true;
        const { post_id, ...used } = comment;
        post.comments.push(used);
        return false;
      });
      return post;
    });

    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

mongoose.connect(process.env.MONGO_URL, { autoIndex: true }).then(async () => {
  app.listen(process.env.PORT, () => {
    console.log(`Listening at port ${process.env.PORT}`);
  });
});
