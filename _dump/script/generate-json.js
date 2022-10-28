const fs = require("fs");
const mongo = require("mongoose");

const run = async () => {
  postJSON = [];
  postQueryJSON = [];
  commentJSON = [];
  commentQJSON = [];
  for (let i = 0; i < 100_000; i++) {
    post_id = mongo.Types.ObjectId();
    post = { post_id, title: `Post ${i + 1}` };
    postQ = { post_id, title: `Post ${i + 1}`, comments: [] };
    for (let j = 0; j < 10; j++) {
      comment_id = mongo.Types.ObjectId();
      comment = {
        post_id,
        comment: `Comment Text ${i + 1}-${j + 1}`,
        comment_id,
      };

      commentQ = { comment: `Comment Text ${i + 1}-${j + 1}`, comment_id };
      postQ.comments.push(commentQ);
    }
    postJSON.push(post);
    postQueryJSON.push(postQ);
    commentJSON.push(comment);
  }

  fs.writeFile("json/post.json", JSON.stringify(postJSON), function (err) {
    if (err) throw err;
    console.log("complete");
  });

  fs.writeFile(
    "json/post_query.json",
    JSON.stringify(postQueryJSON),
    function (err) {
      if (err) throw err;
      console.log("complete");
    }
  );

  fs.writeFile(
    "json/comment.json",
    JSON.stringify(commentJSON),
    function (err) {
      if (err) throw err;
      console.log("complete");
    }
  );

  fs.writeFile(
    "json/comment_q.json",
    JSON.stringify(commentJSON),
    function (err) {
      if (err) throw err;
      console.log("complete");
    }
  );
};

run();
