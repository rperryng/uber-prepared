'use strict';

var express = require('express');
var logger = require('logger');
var uberServiceManager = require('./uber-service-manager.js');

var app = module.exports = express();

var router = express.Router();
app.use('/api', router);

router.get('/products', function (req, res, next) {
  var order = {
    start: {
      lat: 37.4142744,
      long: -122.077409
    },
    end: {
      lat: 37.431247,
      long: -122.145733
    },
    time: 1439726400, // August 16, 5:00:00 AM
  };

  uberServiceManager.placeOrder(order);
  res.sendStatus(200);
});

router.use(function (err, req, res, next) {
  logger.error(err.stack || err);
  if (res) res.sendStatus(500);
});
