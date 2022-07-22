const fs = require("fs");
const path = require("path");

const POST_SIZE = 10_000;
const COMMENT_EACH_POST_SIZE = 100;
const FILE_PATH = path.join(__dirname, "../dummy/posts.json");

const data = { posts: [] };
for (let i = 1; i <= POST_SIZE; i++) {
  const post = { title: `Post ${i}`, body: `Body ${i}`, comments: [] };
  for (let j = 1; j <= COMMENT_EACH_POST_SIZE; j++) {
    const comment = { text: `Comment ${j}` };
    post.comments.push(comment);
  }
  data.posts.push(post);
}

fs.writeFile(FILE_PATH, JSON.stringify(data), (err) => {
  if (err) throw err;
  console.log("complete");
});
