const Joi = require('joi');
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  eventDescription: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200,
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
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },
  createdBy: {
    type: String,
  },
  updatedBy: {
    type: String,
  },
});
const Event = mongoose.model('Event', eventSchema);

exports.eventSchema = eventSchema;
exports.Event = Event;
