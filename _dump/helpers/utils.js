const { performance } = require("perf_hooks");

const range = (start, end) => {
  const length = end - start;
  return Array.from({ length }, (_, i) => start + i);
};

const getDuration = async (fn) => {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000 / 60;
  return duration;
};

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
  range,
  getDuration,
  promiseAllInBatches,
};
