const {
  ServicePost,
  ServiceComment,
  ServiceQuery,
} = require("../helpers/mongo");
const { getDuration } = require("./utils");

const freeDb = async (...services) => {
  await Promise.allSettled(
    services.map(async (service) => {
      await service.free();
      await service.conn.close(true);
    })
  );
};

const free = async () => {
  return freeDb(new ServicePost(), new ServiceComment(), new ServiceQuery());
};

const main = async () => {
  console.log("Clearing all collection...");
  const duration = await getDuration(free);
  console.log(`Clear all collection took ${duration} minutes`);
};

main();
