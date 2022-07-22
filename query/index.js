const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

const Comment = mongoose.Schema(
  { comment_id: String, text: String },
  { _id: false }
);

const Post = mongoose.model(
  "post",
  new mongoose.Schema(
    {
      title: String,
      body: String,
      post_id: { type: String, unique: true },
      comments: [Comment],
    },
    { _id: false }
  )
);

const kafka = new Kafka({
  clientId: "service_query",
  brokers: process.env.KAFKA_BOOTSTRAP_SERVERS.split(","),
});
const consumer = kafka.consumer({ groupId: "service_query" });

app.get("/posts", async (req, res) => {
  try {
    const limit = req.query.limit ?? 10;
    const posts = await Post.find({}, {_id: 0, __v: 0}).limit(limit);
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const postCreatedHandler = async ({ _id, title, body }) => {
  try {
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
    await Post.findOneAndUpdate(
      { post_id },
      { $push: { comments: { comment_id: _id, text } } },
      { upsert: true }
    );
  } catch (err) {
    console.log({
      error: err.message,
      payload: { comment_id: _id, post_id, text },
    });
  }
};

mongoose.connect(process.env.MONGO_URL).then(async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "PostCreated", fromBeginning: true });
  await consumer.subscribe({ topic: "CommentCreated", fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const val = JSON.parse(message.value);
      if (topic == "PostCreated") {
        postCreatedHandler(val);
      }
      if (topic == "CommentCreated") {
        commentCreatedHandler(val);
      }
    },
  });

  app.listen(process.env.PORT, () => {
    console.log(`Listening at port ${process.env.PORT}`);
  });
});
