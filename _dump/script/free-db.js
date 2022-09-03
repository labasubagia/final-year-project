const {
  ServicePost,
  ServiceComment,
  ServiceQuery,
  freeDb,
} = require("../helpers/mongo");
const { getDuration } = require("../helpers/utils");

const free = async () => {
  return freeDb(new ServicePost(), new ServiceComment(), new ServiceQuery());
};

const main = async () => {
  console.log("Clearing all collection...");
  const duration = await getDuration(free);
  console.log(`Clear all collection took ${duration} minutes`);
};

main();
