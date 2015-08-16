'use strict';

var express = require('express');
var async = require('async');
var uuid = require('node-uuid');
var logger = require('logger');
var moment = require('moment');
var twilio = require('twilio');
var User = require('./user.model.js');
var messageParser = require('./message-parser.js');
var uberServiceManager = require('./uber-service-manager.js');
var agendaInstance = require('../agenda-instance.js');

var app = module.exports = express();
var twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

var router = express.Router();
app.use('/twilio', router);

router.use(function (req, res, next) {
  if (req.body && req.body.Body && req.body.Body.toLowerCase() === 'ubercancel') {
    var number = req.body.From;
    if (number.indexOf('+') !== -1) {
      number = number.slice(1).trim();
    }
    agendaInstance.cancel({name: number}, function (err, numRemoved) {
      if (err) return next(err);
      logger.info('Removed job ' + number);
      sendText('Your uber has been cancelled', number);
    });
  }

  next();
});

router.post('/register', function (req, res, next) {
  var number = req.body.number;
  if (number.indexOf('+') !== -1) {
    number = number.slice(1).trim();
  }

  if (!number) {
    res.sendStatus(400);
    sendText('Can\'t create user without phone number', number);
    return;
  }

  User.findOne({number: number}, function (err, user) {
    if (err) return next(err);

    if (user) {
      res.sendStatus(400);
      sendText('A user with phone number ' + number + ' already exists', number);
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
      sendText('User with ' + number + ' created successfully\n' +
        'Type an address to request an Uber. Text UBERCANCEL to cancel this request at any time.', number);
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
  var number = req.body.From;
  if (number.indexOf('+') !== -1) {
    number = number.slice(1).trim();
  }

  User.findOne({number: number}, function (err, user) {
    if (err) return next(err);

    // user exists, carry on
    if (user) {
      req.user = user;
      return next();

    } else {
      res.sendStatus(200);
      sendText('Looks like you haven\'t signed up yet.  Get started with the following link: https://9fcb1195.ngrok.io/uber/signup/' + number, req.body.From);
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
    sendText('Your request has been cancelled.  Text another address to start a new request.', req.body.From);
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
      sendText(data.name + '\n' + data.address + '\nIs this correct?', req.body.From);
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
      sendText('What is your destination?', req.body.From);
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
      sendText('Oh no! Try being more specific.', req.body.From);
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
      sendText(data.name + '\n' + data.address + '\nIs this correct?', req.body.From);
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
      sendText('How soon would you like to be picked up (in hours/minutes)?', req.body.From);
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
      sendText('Oh no! Try being more specific.', req.body.From);
    });
  }
}

function requestTime(req, res, next) {
  if (req.user.state !== 'request-time') return next();

  var time = messageParser.parseTime(req.body.Body);
  if (time.hours <= 0 && time.minutes <= 0) {
    res.sendStatus(200);
    sendText('Oh no! We couldn\'t understand that. Please enter how soon would you like to be picked up (in hours/minutes).', req.body.From);
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
    sendText(timeConfirmationMessage, req.body.From);
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
      sendText('Request successfully submitted.', req.body.From);
      uberServiceManager.placeOrder(user);
    });

  } else {
    user.state = 'request-time';
    user.time = 0;
    user.save(function (err, user) {
      if (err) return next(err);
      res.sendStatus(200);
      sendText('Oh no! Try entering a time with the following format: 5 hours, 30 minutes.', req.body.From);
    });
  }
}

// Error handling middleware
router.use(function (err, req, res, next) {
  logger.error(err.stack || err);

  if (!res) return;
  res.sendStatus(500);
  sendText('Something horrible has happened - See logs', req.body.From);
});


function sendText(message, number, callback) {
  var options = {
    from: process.env.TWILIO_PHONE_NUM,
    to: number,
    body: message
  };
  twilioClient.messages.create(options, callback);
}
