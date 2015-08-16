'use strict';

var express = require('express');
var uuid = require('node-uuid');
var moment = require('moment');
var uberServiceManager = require('./uber-service-manager.js');
var User = require('./user.model.js');

var app = module.exports = express();

var router = express.Router();
app.use('/android', router);

router.post('/data', function (req, res, next) {
	var body = req.body;

	User.findOne({number: body.phone}, function (err, user) {
    if (err) return next(err);

    if (user) {
      user.state = 'submitted';
	    user.start = {
	    	lat: body.pickup_lat,
	    	lng: body.pickup_lng
	    };
	    user.end = {
	    	lat: body.dest_lat,
	    	lng: body.dest_lng
	    };
	    user.time = moment().add(body.hours, 'h').add(body.minutes, 'm').unix();

	    user.save(function (err, user) {
		    if (err) return next(err);

		    res.sendStatus(200);
		  });
		  uberServiceManager.placeOrder(user);
	  }
	});
});

router.post('/cancel', function (req, res, next) {
	var number = req.body.phone;

	// find user by number
	User.findOne({number: number}, function (err, user) {
    if (err) return next(err);

    if (user) {
      user.state = 'request-start';
	    user.save(function (err, user) {
		    if (err) return next(err);
		    res.sendStatus(200);
		  });
	  }
	});
});
