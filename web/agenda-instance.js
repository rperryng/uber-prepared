'use strict';

var Agenda = require('agenda');

var agenda = module.exports = new Agenda({
  db: {
    address: process.env.DB_URI
  }
});
