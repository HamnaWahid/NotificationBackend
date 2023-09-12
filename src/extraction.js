/* eslint-disable no-cond-assign */
function extractPlaceholders(inputString) {
  const regex = /\{([^}]+)\}/g;
  const placeholders = [];
  let match;

  while ((match = regex.exec(inputString)) !== null) {
    placeholders.push(match[1]);
  }

  return placeholders;
}
module.exports = {
  extractPlaceholders,
};
