const mongoose = require("mongoose");

const MONGO_SERVER = "mongodb://localhost:27017";

class Service {
  constructor() {
    this.models = [];
  }
  async free() {
    await Promise.allSettled(
      this.models.map(async (model) => await model.deleteMany({}))
    );
  }
}

class ServicePost extends Service {
  constructor() {
    super();

    this.conn = mongoose.createConnection(`${MONGO_SERVER}/svc_post`);

    this.postModel = this.conn.model("Post", {
      title: String,
      body: String,
    });

    this.models = [this.postModel];
  }
}

class ServiceComment extends Service {
  constructor() {
    super();

    this.conn = mongoose.createConnection(`${MONGO_SERVER}/svc_comment`);

    this.commentModel = this.conn.model("Comment", {
      post_id: { type: mongoose.ObjectId, index: true },
      text: String,
    });

    this.models = [this.commentModel];
  }
}

class ServiceQuery extends Service {
  constructor() {
    super();

    this.conn = mongoose.createConnection(`${MONGO_SERVER}/svc_query`);

    this.commentModel = this.conn.model("Comment", {
      comment_id: { type: mongoose.ObjectId, index: true },
      post_id: { type: mongoose.ObjectId, index: true },
      text: String,
    });

    this.postModel = this.conn.model("Post", {
      post_id: { type: mongoose.ObjectId, index: true },
      title: String,
      body: String,
    });

    this.postQueryModel = this.conn.model("Post_Query", {
      title: String,
      body: String,
      post_id: { type: mongoose.ObjectId, index: { unique: true } },
      comments: {
        type: [
          new mongoose.Schema(
            {
              comment_id: { type: mongoose.ObjectId, index: true },
              text: String,
            },
            { _id: false }
          ),
        ],
        default: [],
      },
    });

    this.models = [this.commentModel, this.postModel, this.postQueryModel];
  }
}

const freeDb = async (...services) => {
  await Promise.allSettled(
    services.map(async (service) => {
      await service.free();
      await service.conn.close(true);
    })
  );
};

module.exports = {
  ServiceComment,
  ServicePost,
  ServiceQuery,
  freeDb,
};
