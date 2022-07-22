const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// Using CQRS
app.get("/posts", async (req, res) => {
  try {
    const limit = req.query.limit ?? 10;
    const response = await axios.get(
      `${process.env.SERVICE_QUERY_HOST}/posts`,
      { params: { limit } }
    );
    const data = await response.data;
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Using API Composition
app.get("/posts2", async (req, res) => {
  try {
    const limit = req.query.limit ?? 10;
    const postResponse = await axios.get(
      `${process.env.SERVICE_POST_HOST}/posts`,
      { params: { limit } }
    );
    let postData = await postResponse.data;
    const postIds = postData.map((post) => post._id);

    const commentResponse = await axios.post(
      `${process.env.SERVICE_COMMENT_HOST}/search-comments-by-post-ids`,
      { post_ids: postIds }
    );
    let commentData = await commentResponse.data;

    postData = postData.map((post) => {
      post.comments = [];
      const restComments = [];

      commentData.forEach((comment) => {
        if (comment.post_id == post._id) {
	  comment.comment_id = comment._id
	  const {_id, post_id, __v, ...used} = comment;
          post.comments.push(used);
        } else {
          restComments.push(comment);
        }
      });
      commentData = restComments;
       
      post.post_id = post._id;
      const {_id, __v, ...used} = post;
      return used;
    });

    res.send(postData);
  } catch (error) {
    res.status(500).send({ error: error });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { title, body } = req.body;
    const response = await axios.post(
      `${process.env.SERVICE_POST_HOST}/posts`,
      { title, body }
    );
    const data = await response.data;
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    const { text } = req.body;
    const response = await axios.post(
      `${process.env.SERVICE_COMMENT_HOST}/comments`,
      { post_id: postId, text }
    );
    const data = await response.data;
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Listening at port ${process.env.PORT}`);
});
