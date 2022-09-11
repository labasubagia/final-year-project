const express = require("express");
const cors = require("cors");
const axios = require("axios");
const os = require("os");
const { promiseAllInBatches } = require("./utils");

const app = express();
app.use(express.json({ limit: "500mb" }));
app.use(cors());

const FETCH_POST_LIMIT_DEFAULT = 10;
const SERVICE_POST_HOST = process.env.SERVICE_POST_HOST;
const SERVICE_COMMENT_HOST = process.env.SERVICE_COMMENT_HOST;
const SERVICE_QUERY_HOST = process.env.SERVICE_QUERY_HOST;

const fetchPost = async (limit = FETCH_POST_LIMIT_DEFAULT) => {
  const url = `${SERVICE_POST_HOST}/posts`;
  const body = { params: { limit } };
  const res = await axios.get(url, body);
  const data = await res.data;
  return data ?? [];
};

const fetchComments = async (postIds = []) => {
  const url = `${SERVICE_COMMENT_HOST}/search-comments-by-post-ids`;
  const body = { post_ids: postIds };
  const res = await axios.post(url, body);
  const data = await res.data;
  return data ?? [];
};

// Index
app.get("/", (req, res) => res.send({ message: "Ok!" }));

// API Composition: Using ID Array and single request
app.get("/posts-api-comp-id-array", async (req, res) => {
  try {
    let posts = await fetchPost(req.query.limit);
    const postIds = posts.map((post) => post._id);

    // Get comment of all post at once
    let comments = await fetchComments(postIds);

    posts = posts.map((post) => {
      post.comments = [];
      const restComments = [];

      comments.forEach((comment) => {
        if (comment.post_id == post._id) {
          comment.comment_id = comment._id;
          const { _id, post_id, __v, ...used } = comment;
          post.comments.push(used);
        } else {
          restComments.push(comment);
        }
      });
      comments = restComments;

      post.post_id = post._id;
      const { _id, __v, ...used } = post;
      return used;
    });

    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error });
  }
});

// API Composition: Using parallel request
app.get("/posts-api-comp-parallel", async (req, res) => {
  try {
    let posts = await fetchPost(req.query.limit);
    posts = await promiseAllInBatches(posts, os.cpus().length, async (post) => {
      let comments = await fetchComments([post._id]);
      post.comments = comments.map((comment) => {
        comment.comment_id = comment._id;
        const { _id, post_id, __v, ...used } = comment;
        return used;
      });
      post.post_id = post._id;
      const { _id, __v, ...used } = post;
      return used;
    });
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// API Composition: Using sequential request
app.get("/posts-api-comp-sequential", async (req, res) => {
  try {
    const posts = await fetchPost(req.query.limit);
    // Get comment of each post one by one
    for (let post of posts) {
      let comments = await fetchComments([post._id]);
      comments = comments.map((comment) => {
        comment.comment_id = comment._id;
        const { _id, post_id, __v, ...used } = comment;
        return used;
      });
      post.comments = comments;
      post.post_id = post._id;
      delete post._id;
      delete post.__v;
    }
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Using CQRS: Materialize view
app.get("/posts-cqrs-materialize", async (req, res) => {
  try {
    const limit = req.query.limit ?? FETCH_POST_LIMIT_DEFAULT;
    const response = await axios.get(
      `${SERVICE_QUERY_HOST}/posts-materialize`,
      { params: { limit } }
    );
    const data = await response.data;
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Using CQRS: Aggregate Query
app.get("/posts-cqrs-query-agg", async (req, res) => {
  try {
    const limit = req.query.limit ?? FETCH_POST_LIMIT_DEFAULT;
    const response = await axios.get(`${SERVICE_QUERY_HOST}/posts-query-agg`, {
      params: { limit },
    });
    const data = await response.data;
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Using CQRS: Manual Relation
app.get("/posts-cqrs-query-manual", async (req, res) => {
  try {
    const limit = req.query.limit ?? FETCH_POST_LIMIT_DEFAULT;
    const response = await axios.get(
      `${SERVICE_QUERY_HOST}/posts-query-manual`,
      { params: { limit } }
    );
    const data = await response.data;
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Create Post
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

// Create Comment
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
