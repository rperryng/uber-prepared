'use strict';

var mongoose = require('mongoose');
var uuid = require('node-uuid');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  uuid: { type: String, default: uuid.v4() },
  number: { type: String, unique: true },
  state: { type: String, enum: ['request-start', 'confirm-start', 'request-end', 'confirm-end', 'request-time', 'confirm-time', 'submitted', 'ordered'] },
  start: {
  	lat: Number,
  	lng: Number
  },
  end: {
  	lat: Number,
  	lng: Number
  },
  time: Number,
  access_token: String,
  refresh_token: String
});

module.exports = mongoose.model('User', userSchema);
