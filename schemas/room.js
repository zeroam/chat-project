const mongoose = require('mongoose');

const { Schema } = mongoose;
const roomSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  max: {
    type: Number,
    required: true,
    defaultValue: 10,
    min: 2,
  },
  owner: {
    type: String,
    required: true,
  },
  password: String,
  count: {
    type: Number,
    defaultValue: 0,
    required: true,
  },
  createdAt: {
    type: Date,
    dafualt: Date.now,
  }
});

module.exports = mongoose.model('Room', roomSchema);