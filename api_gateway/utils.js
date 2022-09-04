const promiseAllInBatches = async (items = [], batchSize = 10, callback) => {
  let position = 0;
  let results = [];
  while (position < items.length) {
    const itemsForBatch = items.slice(position, position + batchSize);
    results = [
      ...results,
      ...(
        await Promise.allSettled(itemsForBatch.map((item) => callback(item)))
      ).map((v) => v.value),
    ];
    position += batchSize;
  }
  return results;
};

module.exports = {
  promiseAllInBatches,
};
