'use strict';

var express = require('express');
var async = require('async');
var uuid = require('node-uuid');
var logger = require('logger');
var moment = require('moment');
var twilio = require('twilio');
var User = require('./user.model.js');
var messageParser = require('./message-parser.js');

var app = module.exports = express();
var twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

var router = express.Router();
app.use('/twilio', router);

router.post('/register', function (req, res, next) {
  var number = req.body.number;

  if (!number) {
    res.sendStatus(400);
    sendMessage('Can\'t create user without phone number');
    return;
  }

  User.findOne({number: number}, function (err, user) {
    if (err) return next(err);

    if (user) {
      res.sendStatus(400);
      sendMessage('A user with phone number ' + number + ' already exists');
      return;
    }

    user = new User({
      uuid: uuid.v4(),
      number: number,
      state: 'request-start',
      token: 'null'
    });
    user.save(function (err, user) {
      if (err) return next(err);

      res.sendStatus(200);
      sendMessage('User with ' + number + ' created successfully\n' +
        'Type an address to request an Uber. Text CANCEL to cancel this request at any time.');
    });
  });
});

router.post('/callback',
  firstTimeUser,
  cancelMiddleware,
  requestStart,
  confirmStart,
  requestEnd,
  confirmEnd,
  requestTime,
  confirmTime
);

function firstTimeUser(req, res, next) {
  User.findOne({number: req.body.From}, function (err, user) {
    if (err) return next(err);

    // user exists, carry on
    if (user) {
      req.user = user;
      return next();

    } else {
      res.sendStatus(200);
      sendMessage('Looks like you haven\'t signed up yet.  Get started with the following link: http://uber-prepared.com/register');
      return;
    }
  });
}

function cancelMiddleware(req, res, next) {
  if (!messageParser.parseCancel(req.body.Body)) return next();

  var user = req.user;
  user.state = 'request-start';
  user.save(function (err, user) {
    if (err) return next(err);
    res.sendStatus(200);
    sendMessage('Your request has been cancelled.  Text another address to start a new request.');
  });
}

function requestStart(req, res, next) {
  if (req.user.state !== 'request-start') return next();

  messageParser.parseLocation(req.body.Body, function (err, data) {
  	if (err) return next(err);

    var user = req.user;
    user.state = 'confirm-start';
    user.start = {
      lat: data.location.lat,
      lng: data.location.lng
    };
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendMessage(data.name + '\n' + data.address + '\nIs this correct?');
    });
  });
}

function confirmStart(req, res, next) {
  if (req.user.state !== 'confirm-start') return next();

  var confirmed = messageParser.parseConfirmation(req.body.Body);
  var user = req.user;
  if (confirmed) {
    user.state = 'request-end';
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendMessage('What is your destination?');
    });

  } else {
    user.state = 'request-start';
    user.start = {
      lat: 0,
      lng: 0
    };
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendMessage('Oh no! Try being more specific.');
    });
  }
}

function requestEnd(req, res, next) {
  if (req.user.state !== 'request-end') return next();

  messageParser.parseLocation(req.body.Body, function (err, data) {
    if (err) return next(err);

    var user = req.user;
    user.state = 'confirm-end';
    user.end = {
      lat: data.location.lat,
      lng: data.location.lng
    };
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendMessage(data.name + '\n' + data.address + '\nIs this correct?');
    });
  });
}

function confirmEnd(req, res, next) {
  if (req.user.state !== 'confirm-end') return next();

  var confirmed = messageParser.parseConfirmation(req.body.Body);
  var user = req.user;

  if (confirmed) {
    user.state = 'request-time';
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendMessage('How soon would you like to be picked up (in hours/minutes)?');
    });

  } else {
    user.state = 'request-end';
    user.end = {
      lat: 0,
      lng: 0
    };
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendMessage('Oh no! Try being more specific.');
    });
  }
}

function requestTime(req, res, next) {
  if (req.user.state !== 'request-time') return next();

  var time = messageParser.parseTime(req.body.Body);
  if (time.hours <= 0 && time.minutes <= 0) {
    res.sendStatus(200);
    sendMessage('Oh no! We couldn\'t understand that. Please enter how soon would you like to be picked up (in hours/minutes).');
    return;
  }

  var user = req.user;
  user.state = 'confirm-time';
  user.time = moment().add(time.hours, 'h').add(time.minutes, 'm').unix();
  logger.info('user.time: ' + user.time);
  user.save(function (err, user) {
    if (err) return next(err);
    logger.info('hours %d minutes %d', time.hours, time.minutes);

    var timeConfirmationMessage = 'Pick up in ';
    if (time.hours > 0) {
      timeConfirmationMessage += time.hours + ' hours';
      if (time.minutes > 0) {
        timeConfirmationMessage += ' and ';
      }
    }
    if (time.minutes > 0) {
      timeConfirmationMessage += ((time.minutes) ? time.minutes : 0) + ' minutes';
    }
    timeConfirmationMessage += '?';

    res.sendStatus(200);
    sendMessage(timeConfirmationMessage);
  });
}

function confirmTime(req, res, next) {
  if (req.user.state !== 'confirm-time') return next();

  var confirmed = messageParser.parseConfirmation(req.body.Body);
  var user = req.user;

  if (confirmed) {
    user.state = 'submitted';
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendMessage('Request successfully submitted.');
    });

  } else {
    user.state = 'request-time';
    user.time = 0;
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      ('Oh no! Try entering a time with the following format: 5 hours, 30 minutes.');
    });
  }
}

// Error handling middleware
router.use(function (err, req, res, next) {
  logger.error(err);
  logger.error(err.stack);

  if (!res) return;
  res.sendStatus(500);
  sendMessage('Something horrible has happened - See logs');
});


function sendMessage(message, callback) {
  var options = {
    from: process.env.TWILIO_PHONE_NUM,
    to: number,
    body: message
  }
  twilioClient.messages.create(options, callback);
}
