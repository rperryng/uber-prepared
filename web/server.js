'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var logger = require('logger');
var env = require('node-env-file');
var mongoose = require('mongoose');

env(__dirname + '/.env');
var agendaInstance = require('./agenda-instance.js');

agendaInstance.start();

var app = express();

// Connect to MongoDB
mongoose.connect(process.env.DB_URI);

// Rendering options
app.set('view engine', 'jade');
app.set('views', __dirname + '/server/views');

// Parse url encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/registration-complete', function (req, res, next) {
  res.render('registration-complete');
});

// Request logging
app.use(morgan('dev', {stream: logger.morganStream}));

// Expose front end resources
app.use('/client', express.static(__dirname + '/client/dist'));
app.use('/fonts', express.static(__dirname + '/client/resources/fonts'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

// Routing
app.use(require('./server/twilio-routes.js'));
app.use(require('./server/uber-oauth-routes.js'));
app.use(require('./server/user-routes.js'));
app.use(require('./server/uber-service-routes.js'));
app.use(require('./server/android-routes.js'));
app.use(require('./server/main'));

app.use(function (req, res, next) {
  res.sendStatus(404);
});

app.use(function (err, req, res, next) {
  logger.error(err.stack || err);
  if (res) res.sendStatus(500);
});

app.listen(process.env.PORT, function () {
  logger.info('listening on port >>> ' + process.env.PORT);
});
