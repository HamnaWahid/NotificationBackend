const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  appDescription: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: String,
  },
  updatedBy: {
    type: String,
  },
});
const Application = mongoose.model('Application', applicationSchema);

exports.applicationSchema = applicationSchema;
exports.Application = Application;
