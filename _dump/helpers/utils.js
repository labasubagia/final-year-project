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

module.exports = {
  range,
  getDuration,
};
