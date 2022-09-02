const { performance } = require("perf_hooks");
const { createPost, createComment, range, startFrom } = require("./utils");

const POST_SIZE = Number(process.argv[2] ?? 10_000);
const COMMENT_EACH_POST_SIZE = Number(process.argv[3] ?? 10);
const START_FROM = Number(process.argv[4] ?? 1);
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

const generateWithCommentParallel = async () => {
  for (let i = START_FROM; i < postLimit; i++) {
    const post = await createPost({
      title: `Title ${i}`,
      body: `Body ${i}`,
    });
    const comments = await Promise.allSettled(
      range(1, COMMENT_EACH_POST_SIZE + 1).map((j) =>
        createComment({
          post_id: post._id,
          text: `Comment ${i}-${j + 1}`,
        })
      )
    );
    console.log(`Post ${i} with ${comments.length} comments`);
  }
};

const run = async (fn) => {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000 / 60;
  console.log(`Dump posts took ${duration} minutes`);
};

const main = async () => {
  console.log(
    `Create posts from ${START_FROM} to ${
      postLimit - 1
    } with ${COMMENT_EACH_POST_SIZE} comment for each post`
  );
  await run(generateSequential);
};

main();
