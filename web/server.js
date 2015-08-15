'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var logger = require('logger');
var env = require('node-env-file');

env(__dirname + '/.env');

var app = express();

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
