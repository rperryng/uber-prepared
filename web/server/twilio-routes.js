'use strict';

var express = require('express');
var logger = require('logger');
var uuid = require('node-uuid');
var User = require('./user.model.js');
var messageParser = require('./message-parser.js');

var app = module.exports = express();

app.post('/register', function (req, res, next) {
  var number = req.body.number;

  if (!number) {
    res.status(400).send('Can\'t create user without phone number');
    return;
  }

  if (User.findOne({number: number}, function (err, user) {
    if (err) {
      logger.error(err);
      return next(err);
    }

    if (user) {
      res.status(400).send('A user with phone number ' + number + ' already exists');
      return;
    }

    user = new User({
      uuid: uuid.v4(),
      number: number,
      state: 'clean',
      token: 'null'
    });
    user.save(function (err, user) {
      if (err) {
        logger.error(err);
        return next(err);
      }

      res.status(200).send('User with ' + number + ' created successfully');
    })
  }));
});

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
  if (req.user.state !== 'request-location') return next();

  messageParser.parseLocation(req.body.Body, function (err, data) {
  	if (err) {
  		logger.error(err);
  		res.sendStatus(500);
  		return;
  	}
  	logger.info(data);
  	res.status(200).send(data.name + "\n" + data.address);
  });
}

function confirmLocation(req, res, next) {
  if (req.user.state !== 'confirm-location') return next();


}

function requestTime(req, res, next) {
  if (req.user.state !== 'confirm-time') return next();
}
