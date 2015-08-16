'use strict';

var express = require('express');
var async = require('async');
var request = require('request');
var logger = require('logger');
var twilio = require('twilio');
var uuid = require('node-uuid');
var User = require('./user.model.js');

var app = module.exports = express();
var twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

var router = express.Router();
app.use('/uber', router);

// TODO: get a domain
var REDIRECT_URI = 'https://9fcb1195.ngrok.io/uber/callback';

router.get('/signup/:number', function (req, res, next) {
  var number = req.params.number;
  User.findOne({number: number}, function (err, user) {
    if (err) return next(err);

    if (user) {
      res.status(400).send('A user with this phone number already exists');
      return;
    }

    var uberSigninUrl = 'https://login.uber.com/oauth/authorize';
    uberSigninUrl += '?response_type=code';
    uberSigninUrl += '&client_id=' + process.env.UBER_CLIENT_ID;
    uberSigninUrl += '&scope=' + encodeURIComponent(['profile', 'request'].join(' '));
    uberSigninUrl += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    uberSigninUrl += '&state=' + number;
    res.redirect(uberSigninUrl);
  });
});

router.get('/callback', function (req, res, next) {
  var authorizationCode = req.query.code;
  var number = req.query.state;

  async.waterfall([
    function (callback) {
      var requestData = {
        client_secret: process.env.UBER_CLIENT_SECRET,
        client_id: process.env.UBER_CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code: authorizationCode
      };

      request.post({
        url: 'https://login.uber.com/oauth/token',
        form: requestData
      }, function (err, response, body) {
        callback(err, body);
      });
    },
    function (body, callback) {
      body = JSON.parse(body);
      User.findOne({number: number}, function (err, user) {
        callback(err, user, body);
      });
    },
    function (user, body, callback) {
      logger.info('body', body);
      user = new User({
        uuid: uuid.v4(),
        number: number,
        state: 'request-start',
        start: {
          lat: 0,
          lng: 0
        },
        end: {
          lat: 0,
          lng: 0
        },
        access_token: body.access_token,
        refresh_token: body.refresh_token
      });
      user.save(function (err, user) {
        callback(err, user);
      });
    },
    function (user, callback) {
      var options = {
        from: process.env.TWILIO_PHONE_NUM,
        to: number,
        body: 'You\'re all set! Text us an address to get started!'
      };

      logger.info('sending text %j', options);

      twilioClient.messages.create(options, function (err, message) {
        callback(err, message);
      });
    }
  ], function (err, message) {
    if (err) return next(err);

    res.sendStatus(200);
  });
});

app.use(function (err, req, res, next) {
  logger.error(err.stack || err);
  if (res) res.sendStatus(500);
});
