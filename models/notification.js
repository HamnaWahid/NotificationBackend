const Joi = require('joi');
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  notificationDescription: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  templateSubject: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 100,
  },
  templateBody: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000,
  },
  createdBy: {
    type: String,
  },
  deletedBy: {
    type: String,
  },
  metadata: [{ type: String }],
});
const Notification = mongoose.model('notification', notificationSchema);

exports.notificationSchema = notificationSchema;
exports.Notification = Notification;
