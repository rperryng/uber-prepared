'use strict';

var mongoose = require('mongoose');
var uuid = require('node-uuid');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  uuid: { type: String, default: uuid.v4() },
  number: { type: String, unique: true },
  state: { type: String, enum: ['request-location', 'confirm-location', 'request-time', 'confirm-time', 'submitted'] },
  token: String,
  bearer_token: String,
  refresh_token: String
});

module.exports = mongoose.model('User', userSchema);