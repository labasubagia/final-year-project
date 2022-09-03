const {
  ServicePost,
  ServiceQuery,
  ServiceComment,
  freeDb,
} = require("../helpers/mongo");
const { getDuration } = require("../helpers/utils");

const POST_SIZE = Number(process.argv[2] ?? 10_000);
const COMMENT_EACH_POST_SIZE = Number(process.argv[3] ?? 10);
const START_FROM = Number(process.argv[4] ?? 1);
const METHOD = Number(process.argv[5] ?? 0);
const postLimit = START_FROM + POST_SIZE;

const servicePost = new ServicePost();
const serviceComment = new ServiceComment();
const serviceQuery = new ServiceQuery();
const services = [servicePost, serviceComment, serviceQuery];

// * Use Sequential is Slower but safer
const generateSequential = async () => {
  try {
    for (let i = START_FROM; i < postLimit; i++) {
      // Post Created
      const postPayload = { title: `Title ${i}`, body: `Body ${i}` };
      const post = await servicePost.postModel.create(postPayload);

      await Promise.allSettled([
        // Responder: Materialize
        serviceQuery.postQueryModel.findOneAndUpdate(
          { post_id: post._id },
          { post_id: post._id, ...postPayload },
          { upsert: true }
        ),
        // Responder: Collection
        serviceQuery.postModel.findOneAndUpdate(
          { post_id: post._id },
          { post_id: post._id, ...postPayload },
          { upsert: true }
        ),
      ]);

      // Comment Created
      const commentIds = [];
      for (let j = 1; j <= COMMENT_EACH_POST_SIZE; j++) {
        const commentPayload = { post_id: post._id, text: `Text ${i}-${j}` };
        const comment = await serviceComment.commentModel.create(
          commentPayload
        );

        await Promise.allSettled([
          // Responder: Materialize
          serviceQuery.postQueryModel.findOneAndUpdate(
            { post_id: post._id },
            {
              $push: {
                comments: { comment_id: comment._id, ...commentPayload },
              },
            },
            { upsert: true }
          ),
          // Responder: Collection
          serviceQuery.commentModel.findOneAndUpdate(
            { comment_id: comment._id },
            { comment_id: comment._id, post_id: post._id, ...commentPayload },
            { upsert: true }
          ),
        ]);

        commentIds.push(comment._id);
      }

      console.log(`Post ${i} with ${commentIds.length} comments`);
    }
  } catch (error) {
    console.error("Error:", error.message);
    await freeDb(...services);
  } finally {
    services.forEach((service) => service.conn.close(true));
  }
};

// * Use bulk is faster but more risky
const generateBulk = async () => {
  try {
    const postPayloads = [];
    const commentPayloads = [];

    // Comment Created
    for (let i = START_FROM; i < postLimit; i++) {
      postPayloads.push({ title: `Title ${i}`, body: `Body ${i}` });
    }
    const posts = await servicePost.postModel.insertMany(postPayloads);
    await serviceQuery.postModel.insertMany(
      posts.map(({ title, body, _id }) => ({ post_id: _id, title, body }))
    );
    console.log("All Post Created");

    // Post Created
    posts.forEach((post) => {
      const i = post.title.split(" ")[1];
      for (let j = 1; j <= COMMENT_EACH_POST_SIZE; j++) {
        commentPayloads.push({ post_id: post._id, text: `Text ${i}-${j}` });
      }
    });
    let comments = await serviceComment.commentModel.insertMany(
      commentPayloads
    );
    await serviceQuery.commentModel.insertMany(
      comments.map(({ text, post_id, _id }) => ({
        post_id,
        comment_id: _id,
        text,
      }))
    );
    console.log("All Comment Created");

    // Materialize
    const postQueryPayloads = posts.map(({ _id, title, body }) => {
      const commentPayloads = [];
      const restComments = [];
      comments.forEach((comment) => {
        if (comment.post_id == _id) {
          commentPayloads.push({
            post_id: comment.post_id,
            comment_id: comment._id,
            text: comment.text,
          });
        } else {
          restComments.push(comment);
        }
      });
      comments = restComments;
      return { post_id: _id, title, body, comments: commentPayloads };
    });
    await serviceQuery.postQueryModel.insertMany(postQueryPayloads);
    console.log("All PostQuery Created");
  } catch (error) {
    console.error("Error:", error.message);
    await freeDb(...services);
  } finally {
    services.forEach((service) => service.conn.close(true));
  }
};

const main = async () => {
  const methods = [generateBulk, generateSequential];
  console.log(
    `Create posts from ${START_FROM} to ${
      postLimit - 1
    } with ${COMMENT_EACH_POST_SIZE} comment for each post`
  );
  const duration = await getDuration(methods[METHOD]);
  console.log(`Dump posts took ${duration} minutes`);
};

main();
