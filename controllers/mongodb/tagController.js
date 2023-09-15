const status = require('http-status');
const winston = require('winston/lib/winston/config');
const { Tag } = require('../../models/tags');

async function listTags(req, res) {
  const allTags = await Tag.find({}, 'tags'); // Retrieve only the 'tags' field
  const tagsList = allTags.map((tag) => tag.tags);
  return res.json({ tags: tagsList });
}

module.exports = {
  listTags,
};
