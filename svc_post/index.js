const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");

const app = express();
app.use(express.json({ limit: "500mb" }));
app.use(cors());

const Post = new mongoose.model("Post", {
  title: String,
  body: String,
});

const kafka = new Kafka({
  clientId: "service_post",
  brokers: process.env.KAFKA_BOOTSTRAP_SERVERS.split(","),
});
const producer = kafka.producer();

app.get("/posts", async (req, res) => {
  try {
    const limit = req.query.limit ?? 10;
    const posts = await Post.find().limit(limit);
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
    await producer.connect();
    await producer.send({
      topic: "PostCreated",
      messages: [{ value: JSON.stringify(post) }],
    });
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
