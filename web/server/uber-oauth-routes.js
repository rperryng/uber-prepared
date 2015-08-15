'use strict';

var express = require('express');
var async = require('async');
var request = require('request');
var logger = require('logger');
var uuid = require('node-uuid');
var User = require('./user.model.js');

var app = module.exports = express();

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
      logger.info('swag');
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
      user = new User({
        uuid: uuid.v4(),
        number: number,
        state: 'request-location',
        access_token: body.access_token,
        refresh_token: body.refresh_token
      });
      user.save(function (err, user) {
        callback(err, user);
      });
    }
  ], function (err, user) {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.use(function (err, req, res, next) {
  logger.error(err.stack);
  if (res) res.sendStatus(500);
});
