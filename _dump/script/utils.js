const { performance } = require("perf_hooks");
const axios = require("axios");

const API_GATEWAY_HOST = "http://localhost:5000";

const createPost = async ({ title, body }) => {
  const url = `${API_GATEWAY_HOST}/posts`;
  const res = await axios.post(url, { title, body });
  const data = await res.data;
  return data;
};

const createComment = async ({ post_id, text }) => {
  const url = `${API_GATEWAY_HOST}/posts/${post_id}/comments`;
  const res = await axios.post(url, { text });
  const data = await res.data;
  return data;
};

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
  createComment,
  createPost,
  API_GATEWAY_HOST,
  range,
  getDuration,
};
