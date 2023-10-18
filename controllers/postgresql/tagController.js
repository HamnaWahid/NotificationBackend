const status = require('http-status');
const winston = require('winston/lib/winston/config');
const knex = require('../../startup/knex');

async function listTags(req, res) {
  const db = knex; // Get the shared database instance
  const allTags = await db('tags').select('tags');
  const tagsList = allTags.map((tag) => tag.tags);
  return res.json({ tags: tagsList });
}

module.exports = { listTags };
