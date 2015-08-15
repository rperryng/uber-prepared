'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var logger = require('logger');
var env = require('node-env-file');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');

env(__dirname + '/.env');

var app = express();

// Connect to MongoDB
mongoose.connect(process.env.DB_URI);

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({ mongooseConnection: mongoose.connection}),
  resave: false,
  saveUninitialized: false
}));

// Parse url encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Request logging
app.use(morgan('dev', {stream: logger.morganStream}));

app.post('/twilio-callback', function (req, res, next) {
  logger.debug('from: %s', req.body.From);
  logger.debug('with message %s', req.body.Body);

  res.sendStatus(200);
});

app.use(function (req, res, next) {
  res.sendStatus(404);
});

app.listen(process.env.PORT, function () {
  console.log('listening on port >>> ' + process.env.PORT);
});
