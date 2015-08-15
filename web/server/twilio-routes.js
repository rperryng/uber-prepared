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

  User.findOne({number: number}, function (err, user) {
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
      state: 'request-location',
      token: 'null'
    });
    user.save(function (err, user) {
      if (err) {
        logger.error(err);
        return next(err);
      }

      res.status(200).send('User with ' + number + ' created successfully\n'
        + 'Type an address to request an Uber.');
    });
  });
});

app.post('/twilio-callback', firstTimeUser, cancelMiddleware, requestLocation, confirmLocation, requestTime, confirmTime);

function firstTimeUser(req, res, next) {
  User.findOne({number: req.body.From}, function (err, user) {
    if (err) {
      logger.error(err);
      return next(err);
    }

    // user exists, carry on
    if (user) {
      req.user = user;
      logger.info('user state: ' + user.state);
      return next();

    } else {
      res.status(200).send('Looks like you haven\'t signed up yet.  Get started with the following link: http://uber-prepared.com/register');
      return;
    }
  });
}

function cancelMiddleware(req, res, next) {
  if (!messageParser.parseCancel(req.body.Body)) return next();

  var user = req.user;
  user.state = 'request-location';
  user.save(function (err, user) {
    if (err) {
      logger.error(err);
      res.sendStatus(500);
      return;
    }

    res.status(200).send('Your request has been cancelled.  Text another address to start a new request');
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

    var user = req.user;
    user.state = 'confirm-location';
    user.save(function (err, user) {
      if (err) {
        logger.error(err);
        res.sendStatus(500);
        return;
      }
      res.status(200).send(data.name + '\n' + data.address + '\nIs this correct?');
    });
  });
}

function confirmLocation(req, res, next) {
  if (req.user.state !== 'confirm-location') return next();

  var confirmed = messageParser.parseConfirmation(req.body.Body);
  var user = req.user;
  if (confirmed) {
    user.state = 'request-time';
    user.save(function (err, user) {
      if (err) {
        logger.error(err);
        res.sendStatus(500);
        return;
      }
      res.status(200).send('What time would you like to be picked up?');
    });
  } else {
    user.state = 'request-location';
    user.save(function (err, user) {
      if (err) {
        logger.error(err);
        res.sendStatus(500);
        return;
      }
      res.status(200).send('Oh no! Try being more specific.');
    });
  }
}

function requestTime(req, res, next) {
  if (req.user.state !== 'request-time') return next();

  var time = messageParser.parseTime(req.body.Body);
  if (!time.hours || !time.minutes) {
    res.status(200).send('Oh no! We couldn\'t understand that. Please enter your pick-up time again.');
  }
  var user = req.user;
  user.state = 'confirm-time';
  user.save(function (err, user) {
    if (err) {
      logger.error(err);
      res.sendStatus(500);
      return;
    }
    logger.info('hours %d minutes %d', time.hours, time.minutes);
    res.status(200).send('Pick up at ' + time.hours + ":" + time.minutes + '?');
  });
}

function confirmTime(req, res, next) {
  if (req.user.state !== 'confirm-time') return next();

  var confirmed = messageParser.parseConfirmation(req.body.Body);
  var user = req.user;
  if (confirmed) {
    user.state = 'submitted';
    user.save(function (err, user) {
      if (err) {
        logger.error(err);
        res.sendStatus(500);
        return;
      }
      res.status(200).send('Request successfully submitted.');
    });
  } else {
    user.state = 'confirm-time';
    user.save(function (err, user) {
      if (err) {
        logger.error(err);
        res.sendStatus(500);
        return;
      }
      res.status(200).send('Oh no! Please enter your pick-up time again.');
    });
  }
}
