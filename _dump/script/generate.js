const os = require("os");
const { getDuration, promiseAllInBatches } = require("../helpers/utils");
const { createPost, createComment } = require("../helpers/api");

const POST_SIZE = Number(process.argv[2] ?? 10_000);
const COMMENT_EACH_POST_SIZE = Number(process.argv[3] ?? 10);
const START_FROM = Number(process.argv[4] ?? 1);
const METHOD = Number(process.argv[5] ?? 0);

const postLimit = START_FROM + POST_SIZE;

// ! Be careful use parallel data generation
// ! Look at device specification first

const generateSequential = async () => {
  for (let i = START_FROM; i < postLimit; i++) {
    const post = await createPost({
      title: `Title ${i}`,
      body: `Body ${i}`,
    });
    const comments = [];
    for (let j = 1; j <= COMMENT_EACH_POST_SIZE; j++) {
      const comment = await createComment({
        post_id: post._id,
        text: `Comment ${i}-${j}`,
      });
      comments.push(comment);
    }
    console.log(`Post ${i} with ${comments.length} comments`);
  }
};

const generateParallel = async () => {
  const threadLimit = os.cpus().length;

  // Make posts payload
  const postsPayload = [];
  for (let i = START_FROM; i < postLimit; i++) {
    postsPayload.push({ title: `Title ${i}`, body: `Body ${i}` });
  }

  // Create posts
  const posts = await promiseAllInBatches(
    postsPayload,
    threadLimit,
    createPost
  );
  console.log(`All ${posts.length} posts created`);

  // Make comments payload
  const commentsPayload = [];
  posts.forEach((post) => {
    const number = post.title.split(" ")[1] ?? "";
    for (let i = 1; i <= COMMENT_EACH_POST_SIZE; i++) {
      commentsPayload.push({
        post_id: post._id,
        text: `Comment ${number}-${i}`,
      });
    }
  });

  // Create comments
  const comments = await promiseAllInBatches(
    commentsPayload,
    threadLimit,
    createComment
  );
  console.log(`All ${comments.length} comments created`);
};

const main = async () => {
  const methods = [generateParallel, generateSequential];
  console.log(
    `Create posts from ${START_FROM} to ${
      postLimit - 1
    } with ${COMMENT_EACH_POST_SIZE} comment for each post`
  );
  const duration = await getDuration(methods[METHOD]);
  console.log(`Dump posts took ${duration} minutes`);
};

main();
