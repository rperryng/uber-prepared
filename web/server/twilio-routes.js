'use strict';

var express = require('express');
var logger = require('logger');
var uuid = require('node-uuid');
var User = require('./user.model.js');
var messageParser = require('')

var app = module.exports = express();

app.post('/twilio-callback', firstTimeUser, requestLocation);

function firstTimeUser(req, res, next) {
  User.findOne({number: req.body.From}, function (err, user) {
    if (err) {
      logger.error(err);
      return next(err);
    }

    // user exists, carry on
    if (user) {
      req.user = user;
      return next();

    } else {
      res.status(200).send('Looks like you haven\'t signed up yet.  Get started with the following link: http://uber-prepared.com/register');
      return;
    }
  });
}

function requestLocation(req, res, next) {
  if (req.user.state !== 'confirm-location') return next();

  messageParser.parseMessage(req.body.Body, function (err, data) {
  	if (err) {
  		logger.error(err);
  		res.sendStatus(500);
  		return;
  	}
  	logger.info(data);
  	res.sendStatus(200);
  });
}

function requestTime(req, res, next) {
  if (req.user.state !== 'confirm-time') return next();
}
