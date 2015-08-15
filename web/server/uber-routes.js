'use strict';

var express = require('express');
var async = require('async');
var request = require('request');
var logger = require('logger');
var User = require('./user.model.js');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');

var app = module.exports = express();

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
  })
}));

var router = express.Router();
app.use('/uber', router);

// TODO: get a domain
var REDIRECT_URI = 'https://12e819b0.ngrok.io/uber/callback';

router.get('/signup/:number', function (req, res, next) {
  var number = req.params.number;
  User.findOne({number: number}, function (err, user) {
    if (err) return next(err);

    if (user) {
      res.status(400).send('A user with this phone number already exists');
      return;
    }

    logger.info(encodeURIComponent(REDIRECT_URI + '?number=' + number));

    var uberSigninUrl = 'https://login.uber.com/oauth/authorize';
    uberSigninUrl += '?response_type=code';
    uberSigninUrl += '&client_id=' + process.env.UBER_CLIENT_ID;
    uberSigninUrl += '&scope=' + encodeURIComponent(['profile', 'request'].join(' '));
    uberSigninUrl += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI + '?number=' + number);
    res.redirect(uberSigninUrl);
  });
});

router.get('/callback', function (req, res, next) {
  var number = req.param('number');
  var authorizationCode = req.param('code');

  var requestData = {
    client_secret: process.env.UBER_CLIENT_SECRET,
    client_id: process.env.UBER_CLIENT_ID,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    code: authorizationCode
  };

  async.waterfall([
    function (callback) {
      request.post({
        url: 'https://login.uber.com/oauth/token',
        form: requestData
      }, function (err, response, body) {
        callback(err, body);
      });
    },
    function (body, callback) {
      User.findOne({number: number}, function (err, user) {
        callback(err, user, body);
      });
    },
    function (user, body, callback) {
      user.bearer_token = body.access_token;
      user.refresh_token = body.refresh_token;
      user.save(function (err, user) {
        callback(err, user);
      });
    }
  ], function (err, user) {
    if (err) return next(err);

  });
});
