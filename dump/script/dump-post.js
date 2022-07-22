const axios = require("axios");
const { performance } = require("perf_hooks");

const API_GATEWAY_HOST = "http://localhost:5000";
const POST_SIZE = Number(process.argv[2] ?? 10_000);
const COMMENT_EACH_POST_SIZE = Number(process.argv[3] ?? 10);
const START_FROM = Number(process.argv[4] ?? 1);
const postLimit = START_FROM + POST_SIZE;

console.log(
  `Create posts from ${START_FROM} to ${
    postLimit - 1
  } with ${COMMENT_EACH_POST_SIZE} comment for each post`
);

const dump = async () => {
  for (let i = START_FROM; i < postLimit; i++) {
    const postRes = await axios.post(`${API_GATEWAY_HOST}/posts`, {
      title: `Title ${i}`,
      body: `Body ${i}`,
    });
    const postData = await postRes.data;

    const commentIds = [];
    for (let j = 1; j <= COMMENT_EACH_POST_SIZE; j++) {
      const commentRes = await axios.post(
        `${API_GATEWAY_HOST}/posts/${postData._id}/comments`,
        { text: `Comment ${j}` }
      );
      const commentData = await commentRes.data;
      commentIds.push(commentData._id);
    }
    console.log(`Post ${i} with ${commentIds.length} comments`);
  }
};

const run = async (fn) => {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000 / 60;
  console.log(`Dump posts took ${duration} minutes`);
};

run(dump);
