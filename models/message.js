const Joi = require('joi');
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  contents: {
    type: String,
  },
  createdBy: {
    type: String,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
  },
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
  },
  email: {
    type: String,
    required: true,
  },
});
const Message = mongoose.model('Message', messageSchema);

exports.messageSchema = messageSchema;
exports.Message = Message;
