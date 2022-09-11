const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");

const app = express();
app.use(express.json({ limit: "500mb" }));
app.use(cors());

const Comment = new mongoose.model("Comment", {
  post_id: { type: mongoose.ObjectId, index: true },
  text: String,
});

const kafka = new Kafka({
  clientId: "service_comment",
  brokers: process.env.KAFKA_BOOTSTRAP_SERVERS.split(","),
});
const producer = kafka.producer();

app.get("/comments", async (_, res) => {
  try {
    const comments = await Comment.find();
    res.send(comments);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/search-comments-by-post-id", async (req, res) => {
  try {
    const { post_id } = req.body;
    const comments = await Comment.aggregate([
      { $match: { post_id: mongoose.Types.ObjectId(post_id) } },
      {
        $addFields: {
          comment_id: "$_id",
          post_id: "$$REMOVE",
          _id: "$$REMOVE",
          __v: "$$REMOVE",
        },
      },
    ]).allowDiskUse(true);
    res.send(comments);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/search-comments-by-post-ids", async (req, res) => {
  try {
    const { post_ids } = req.body;
    const comments = await Comment.aggregate([
      { $match: { post_id: { $in: post_ids.map(mongoose.Types.ObjectId) } } },
      { $addFields: { comment_id: "$_id", _id: "$$REMOVE", __v: "$$REMOVE" } },
    ]).allowDiskUse(true);
    res.send(comments);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/comments", async (req, res) => {
  try {
    const { post_id, text } = req.body;
    const comment = Comment({ post_id, text });
    await comment.save();

    await producer.connect();
    await producer.send({
      topic: "CommentCreated",
      messages: [{ value: JSON.stringify(comment) }],
    });
    res.send(comment);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Listening at port ${process.env.PORT}`);
  });
});
