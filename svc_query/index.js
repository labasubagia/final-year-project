const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

const PUBSUB_TOPIC_POST_CREATED = "PostCreated";
const PUBSUB_TOPIC_COMMENT_CREATED = "CommentCreated";
const FETCH_POST_DEFAULT_LIMIT = 10;

const commentSchema = new mongoose.Schema(
  { comment_id: String, post_id: String, text: String },
  { _id: false }
);
const Comment = new mongoose.model("Comment", commentSchema);

const postSchema = new mongoose.Schema(
  {
    post_id: String,
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
    post_id: { type: String, unique: true },
    comments: {
      type: [
        new mongoose.Schema(
          { comment_id: String, text: String },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);
const PostQuery = new mongoose.model("Post_Query", postQuerySchema);

const kafka = new Kafka({
  clientId: "service_query",
  brokers: process.env.KAFKA_BOOTSTRAP_SERVERS.split(","),
});
const consumer = kafka.consumer({ groupId: "service_query" });

const postCreatedHandler = async ({ _id, title, body }) => {
  try {
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
    const posts = await PostQuery.find({}, { _id: 0, __v: 0 }).limit(limit);
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// CQRS: Normal Query Relation
app.get("/posts-query", async (req, res) => {
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

mongoose.connect(process.env.MONGO_URL, { autoIndex: true }).then(async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: PUBSUB_TOPIC_POST_CREATED,
    fromBeginning: true,
  });
  await consumer.subscribe({
    topic: PUBSUB_TOPIC_COMMENT_CREATED,
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const val = JSON.parse(message.value);
      switch (topic) {
        case PUBSUB_TOPIC_POST_CREATED:
          postCreatedHandler(val);
          break;
        case PUBSUB_TOPIC_COMMENT_CREATED:
          commentCreatedHandler(val);
          break;
        default:
          break;
      }
    },
  });

  app.listen(process.env.PORT, () => {
    console.log(`Listening at port ${process.env.PORT}`);
  });
});
