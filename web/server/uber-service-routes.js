'use strict';

var express = require('express');
var logger = require('logger');
var uberServiceManager = require('./uber-service-manager.js');
var User = require('./user.model.js');

var app = module.exports = express();

var router = express.Router();
app.use('/api', router);

router.get('/products/:number', function (req, res, next) {
  var number = req.params.number;
  User.findOne({number: number}, function (err, user) {
    if (err) return next(err);
    if (!user) res.sendStatus(404);
    uberServiceManager.placeOrder(user);
    res.sendStatus(200);
  });
});

router.use(function (err, req, res, next) {
  logger.error(err.stack || err);
  if (res) res.sendStatus(500);
});
