'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var logger = require('logger');
var env = require('node-env-file');
var mongoose = require('mongoose');

env(__dirname + '/.env');

var app = express();

// Connect to MongoDB
mongoose.connect(process.env.DB_URI);

// Parse url encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Request logging
app.use(morgan('dev', {stream: logger.morganStream}));

// Routing
app.use(require('./server/twilio-routes.js'));
app.use(require('./server/uber-oauth-routes.js'));
app.use(require('./server/user-routes.js'));
app.use(require('./server/uber-service-routes.js'));

app.use(function (req, res, next) {
  res.sendStatus(404);
});

app.listen(process.env.PORT, function () {
  logger.info('listening on port >>> ' + process.env.PORT);
});
