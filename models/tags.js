const Joi = require('joi');
const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  tags: {
    type: String,
  },
});
const Tag = mongoose.model('Tag', TagSchema);

exports.tagSchema = TagSchema;
exports.Tag = Tag;
